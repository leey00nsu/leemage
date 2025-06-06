import * as common from "oci-common";
import * as os from "oci-objectstorage";
import fs from "fs";

// OCI 설정을 동적으로 로드하는 함수
function getOCIConfig() {
  const tenancyId = process.env.OCI_TENANCY_OCID;
  const userId = process.env.OCI_USER_OCID;
  const fingerprint = process.env.OCI_FINGERPRINT;
  const privateKeyPath = process.env.OCI_PRIVATE_KEY_PATH;
  const regionId = process.env.OCI_REGION;
  const namespaceName = process.env.OCI_NAMESPACE;
  const bucketName = process.env.OCI_BUCKET_NAME;

  let privateKey: string | undefined;
  if (privateKeyPath && fs.existsSync(privateKeyPath)) {
    privateKey = fs.readFileSync(privateKeyPath, "utf8");
  } else if (process.env.OCI_PRIVATE_KEY_CONTENT) {
    // 환경 변수에 직접 키 내용을 넣는 경우 (권장하지 않음)
    privateKey = process.env.OCI_PRIVATE_KEY_CONTENT.replace(/\\n/g, "\n");
  } else {
    console.warn(
      "OCI private key path not found or invalid, or OCI_PRIVATE_KEY_CONTENT not set. OCI functionality might be disabled."
    );
  }

  // 모든 필수 환경 변수가 설정되었는지 확인 (네임스페이스, 버킷 이름 포함)
  if (
    !tenancyId ||
    !userId ||
    !fingerprint ||
    !privateKey ||
    !regionId ||
    !namespaceName ||
    !bucketName
  ) {
    console.error(
      "Error: Missing required OCI environment variables. Check OCI_TENANCY_OCID, OCI_USER_OCID, OCI_FINGERPRINT, OCI_PRIVATE_KEY_PATH/CONTENT, OCI_REGION, OCI_NAMESPACE, OCI_BUCKET_NAME."
    );
  }

  return {
    tenancyId,
    userId,
    fingerprint,
    privateKey,
    regionId,
    namespaceName,
    bucketName,
  };
}

// 캐시된 클라이언트 및 설정
let cachedClient: os.ObjectStorageClient | null = null;
let cachedConfig: ReturnType<typeof getOCIConfig> | null = null;

// OCI 클라이언트를 lazy하게 생성
function getOCIClient() {
  if (!cachedClient || !cachedConfig) {
    cachedConfig = getOCIConfig();

    if (
      cachedConfig.tenancyId &&
      cachedConfig.userId &&
      cachedConfig.fingerprint &&
      cachedConfig.privateKey &&
      cachedConfig.regionId &&
      cachedConfig.namespaceName &&
      cachedConfig.bucketName
    ) {
      const provider = new common.SimpleAuthenticationDetailsProvider(
        cachedConfig.tenancyId,
        cachedConfig.userId,
        cachedConfig.fingerprint,
        cachedConfig.privateKey,
        null,
        common.Region.fromRegionId(cachedConfig.regionId)
      );

      cachedClient = new os.ObjectStorageClient({
        authenticationDetailsProvider: provider,
      });
    } else {
      cachedClient = null;
    }
  }

  return { client: cachedClient, config: cachedConfig };
}

// Export된 값들을 동적으로 가져오는 함수들
export function getBucketName(): string | undefined {
  const { config } = getOCIClient();
  return config?.bucketName;
}

export function getOCINamespace(): string | undefined {
  const { config } = getOCIClient();
  return config?.namespaceName;
}

// 기존 코드와의 호환성을 위해 클라이언트를 export하는 함수
export function getObjectStorageClient(): os.ObjectStorageClient | null {
  const { client } = getOCIClient();
  return client;
}

// 호환성을 위한 export (동적으로 평가됨)
export const bucketName = process.env.OCI_BUCKET_NAME;
export const ociNamespace = process.env.OCI_NAMESPACE;
export const ociBucketName = process.env.OCI_BUCKET_NAME;
export const objectStorageClient = getObjectStorageClient();

// 추가: OCI 객체 삭제 함수
export async function deleteObject(objectName: string): Promise<void> {
  const { client, config } = getOCIClient();

  if (!client || !config?.namespaceName || !config?.bucketName) {
    throw new Error(
      "OCI 클라이언트 또는 필수 정보(네임스페이스, 버킷 이름)가 초기화되지 않았습니다."
    );
  }

  console.log(
    `Attempting to delete OCI object: ${objectName} from bucket: ${config.bucketName}`
  );

  try {
    const deleteObjectRequest: os.requests.DeleteObjectRequest = {
      namespaceName: config.namespaceName,
      bucketName: config.bucketName,
      objectName: objectName,
    };

    await client.deleteObject(deleteObjectRequest);
    console.log(`Successfully deleted OCI object: ${objectName}`);
  } catch (error) {
    console.error(`Error deleting OCI object ${objectName}:`, error);
    // 특정 OCI 오류 코드에 따라 다른 처리 가능 (예: 객체 못 찾음 등)
    throw new Error(`OCI 객체 삭제 중 오류 발생: ${objectName}`);
  }
}

/**
 * OCI Object Storage에 파일을 업로드하고 해당 객체의 URL을 반환합니다.
 * @param objectName 저장될 객체의 이름 (경로 포함 가능, 예: 'projectId/imageName.jpg')
 * @param fileBuffer 업로드할 파일의 Buffer
 * @param contentType 파일의 MIME 타입 (예: 'image/jpeg')
 * @returns 업로드된 객체의 URL
 */
export async function uploadObject(
  objectName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  const { client, config } = getOCIClient();

  if (
    !client ||
    !config?.namespaceName ||
    !config?.bucketName ||
    !config?.regionId
  ) {
    throw new Error(
      "OCI 클라이언트 또는 필수 정보(네임스페이스, 버킷 이름, 리전)가 초기화되지 않았습니다."
    );
  }

  console.log(
    `Attempting to upload OCI object: ${objectName} to bucket: ${config.bucketName}`
  );

  try {
    const putObjectRequest: os.requests.PutObjectRequest = {
      namespaceName: config.namespaceName,
      bucketName: config.bucketName,
      objectName: objectName,
      putObjectBody: fileBuffer, // 파일 버퍼 직접 전달
      contentType: contentType,
      contentLength: fileBuffer.length,
    };

    await client.putObject(putObjectRequest);
    console.log(`Successfully uploaded OCI object: ${objectName}`);

    // 업로드 성공 후 객체 URL 생성 (실제 OCI URL 형식에 맞게 조정 필요)
    const objectUrl = `https://objectstorage.${config.regionId}.oraclecloud.com/n/${config.namespaceName}/b/${config.bucketName}/o/${objectName}`;
    return objectUrl;
  } catch (error) {
    console.error(`Error uploading OCI object ${objectName}:`, error);
    throw new Error(`OCI 객체 업로드 중 오류 발생: ${objectName}`);
  }
}
