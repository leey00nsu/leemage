/**
 * Cloudflare R2 Storage Adapter
 *
 * Implements the StorageAdapter interface using AWS SDK S3-compatible API.
 */

import {
  StorageAdapter,
  CreatePresignedUrlOptions,
  PresignedUrlResult,
} from "../adapter";
import { StorageProvider } from "../types";
import { createStorageError, StorageErrorCode } from "../errors";
import type { Readable } from "node:stream";

// Lazy-loaded S3 client to avoid import errors when not configured
let S3Client: typeof import("@aws-sdk/client-s3").S3Client;
let PutObjectCommand: typeof import("@aws-sdk/client-s3").PutObjectCommand;
let GetObjectCommand: typeof import("@aws-sdk/client-s3").GetObjectCommand;
let DeleteObjectCommand: typeof import("@aws-sdk/client-s3").DeleteObjectCommand;
let CopyObjectCommand: typeof import("@aws-sdk/client-s3").CopyObjectCommand;
let getSignedUrl: typeof import("@aws-sdk/s3-request-presigner").getSignedUrl;

async function loadS3Dependencies() {
  if (!S3Client || !getSignedUrl) {
    const s3Module = await import("@aws-sdk/client-s3");
    S3Client = s3Module.S3Client;
    PutObjectCommand = s3Module.PutObjectCommand;
    GetObjectCommand = s3Module.GetObjectCommand;
    DeleteObjectCommand = s3Module.DeleteObjectCommand;
    CopyObjectCommand = s3Module.CopyObjectCommand;

    const presignerModule = await import("@aws-sdk/s3-request-presigner");
    getSignedUrl = presignerModule.getSignedUrl;
  }
}

export class CloudflareR2Adapter implements StorageAdapter {
  readonly provider = StorageProvider.R2;
  private client: InstanceType<
    typeof import("@aws-sdk/client-s3").S3Client
  > | null = null;

  isConfigured(): boolean {
    return !!(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
    );
  }

  private async getClient() {
    if (!this.isConfigured()) {
      throw createStorageError(StorageErrorCode.PROVIDER_NOT_CONFIGURED);
    }

    if (!this.client) {
      await loadS3Dependencies();
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        maxAttempts: 3,
        requestHandler: {
          connectionTimeout: 5_000,
          requestTimeout: 30_000,
          socketTimeout: 30_000,
          throwOnRequestTimeout: true,
          httpsAgent: {
            keepAlive: true,
            maxSockets: 25,
          },
        },
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });
    }

    return this.client;
  }

  private getBucketName(): string {
    return process.env.R2_BUCKET_NAME!;
  }

  async createPresignedUploadUrl(
    options: CreatePresignedUrlOptions,
  ): Promise<PresignedUrlResult> {
    await loadS3Dependencies();
    const client = await this.getClient();
    const bucketName = this.getBucketName();
    const expiresInSeconds = (options.expiresInMinutes || 15) * 60;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: options.objectName,
      ContentType: options.contentType,
      ContentLength: options.contentLength,
    });

    const presignedUrl = await getSignedUrl(client, command, {
      expiresIn: expiresInSeconds,
    });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

    return {
      presignedUrl,
      objectUrl: this.getObjectUrl(options.objectName),
      expiresAt,
    };
  }

  async createReadAccess(objectName: string) {
    const client = await this.getClient();
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: this.getBucketName(), Key: objectName }),
      { expiresIn: 300 },
    );
    return { url };
  }

  async getObjectSize(objectName: string) {
    return (await this.getObjectMetadata(objectName)).size;
  }

  async getObjectMetadata(objectName: string) {
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    const response = await client.send(
      new HeadObjectCommand({ Bucket: this.getBucketName(), Key: objectName }),
    );
    if (response.ContentLength === undefined)
      throw new Error("Missing object size");
    if (!response.ETag) throw new Error("Missing object revision");
    return { size: response.ContentLength, revision: response.ETag };
  }

  async promoteObject(
    sourceObjectName: string,
    destinationObjectName: string,
    sourceRevision: string,
  ) {
    await loadS3Dependencies();
    const client = await this.getClient();
    const bucketName = this.getBucketName();
    const copySource = encodeURIComponent(
      `${bucketName}/${sourceObjectName}`,
    ).replace(/%2F/g, "/");

    await client.send(
      new CopyObjectCommand({
        Bucket: bucketName,
        Key: destinationObjectName,
        CopySource: copySource,
        CopySourceIfMatch: sourceRevision,
      }),
    );
  }

  async downloadObject(objectName: string): Promise<Buffer> {
    await loadS3Dependencies();
    const client = await this.getClient();
    const bucketName = this.getBucketName();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectName,
    });

    const response = await client.send(command);

    if (!response.Body) {
      throw createStorageError(StorageErrorCode.OBJECT_NOT_FOUND);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async uploadObject(
    objectName: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    await loadS3Dependencies();
    const client = await this.getClient();
    const bucketName = this.getBucketName();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectName,
      Body: buffer,
      ContentType: contentType,
    });

    await client.send(command);

    return this.getObjectUrl(objectName);
  }

  async uploadObjectStream(
    objectName: string,
    body: Readable,
    contentType: string,
    contentLength: number,
  ) {
    await loadS3Dependencies();
    const client = await this.getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: this.getBucketName(),
        Key: objectName,
        Body: body,
        ContentType: contentType,
        ContentLength: contentLength,
        IfNoneMatch: "*",
      }),
    );
  }

  async deleteObject(objectName: string): Promise<void> {
    await loadS3Dependencies();
    const client = await this.getClient();
    const bucketName = this.getBucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectName,
    });

    await client.send(command);
  }

  getObjectUrl(objectName: string): string {
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (publicUrl) {
      // 커스텀 도메인 또는 r2.dev 퍼블릭 URL 사용
      const baseUrl = publicUrl.endsWith("/")
        ? publicUrl.slice(0, -1)
        : publicUrl;
      return `${baseUrl}/${objectName}`;
    }

    // 퍼블릭 URL이 설정되지 않은 경우 presigned URL을 통해서만 접근 가능
    // 이 URL은 직접 접근 불가능하며, 다운로드 시 presigned URL 생성 필요
    const accountId = process.env.R2_ACCOUNT_ID;
    const bucketName = this.getBucketName();
    return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${objectName}`;
  }
}
