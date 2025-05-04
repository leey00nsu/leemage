import * as common from "oci-common";
import * as os from "oci-objectstorage";
import fs from "fs";

// 환경 변수 로드 (서버 환경에서만 실행되도록 주의)
const tenancyId = process.env.OCI_TENANCY_OCID;
const userId = process.env.OCI_USER_OCID;
const fingerprint = process.env.OCI_FINGERPRINT;
const privateKeyPath = process.env.OCI_PRIVATE_KEY_PATH;
const regionId = process.env.OCI_REGION;
const namespaceName = process.env.OCI_NAMESPACE;
export const bucketName = process.env.OCI_BUCKET_NAME;

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

// OCI 인증 공급자 생성 (SimpleAuthenticationDetailsProvider 사용)
const provider: common.SimpleAuthenticationDetailsProvider =
  new common.SimpleAuthenticationDetailsProvider(
    tenancyId || "",
    userId || "",
    fingerprint || "",
    privateKey || "", // privateKey 내용 전달
    null, // passPhrase - 필요 시 설정 (현재 null)
    common.Region.fromRegionId(regionId || "")
  );

// OCI Object Storage 클라이언트 생성
// 필요한 모든 변수가 있을 때만 클라이언트 생성
export const objectStorageClient =
  tenancyId &&
  userId &&
  fingerprint &&
  privateKey &&
  regionId &&
  namespaceName &&
  bucketName
    ? new os.ObjectStorageClient({ authenticationDetailsProvider: provider })
    : null;

// 네임스페이스와 버킷 이름도 내보내기
export const ociNamespace = namespaceName;
export const ociBucketName = bucketName; // bucketName도 명시적으로 내보내기

// 필요에 따라 다른 OCI 클라이언트 (예: Image Analysis)도 여기에 추가 가능

// 추가: OCI 객체 삭제 함수
export async function deleteObject(objectName: string): Promise<void> {
  if (!objectStorageClient || !ociNamespace || !ociBucketName) {
    throw new Error(
      "OCI 클라이언트 또는 필수 정보(네임스페이스, 버킷 이름)가 초기화되지 않았습니다."
    );
  }

  console.log(
    `Attempting to delete OCI object: ${objectName} from bucket: ${ociBucketName}`
  );

  try {
    const deleteObjectRequest: os.requests.DeleteObjectRequest = {
      namespaceName: ociNamespace,
      bucketName: ociBucketName,
      objectName: objectName,
    };

    await objectStorageClient.deleteObject(deleteObjectRequest);
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
  if (!objectStorageClient || !ociNamespace || !ociBucketName || !regionId) {
    throw new Error(
      "OCI 클라이언트 또는 필수 정보(네임스페이스, 버킷 이름, 리전)가 초기화되지 않았습니다."
    );
  }

  console.log(
    `Attempting to upload OCI object: ${objectName} to bucket: ${ociBucketName}`
  );

  try {
    const putObjectRequest: os.requests.PutObjectRequest = {
      namespaceName: ociNamespace,
      bucketName: ociBucketName,
      objectName: objectName,
      putObjectBody: fileBuffer, // 파일 버퍼 직접 전달
      contentType: contentType,
      contentLength: fileBuffer.length,
    };

    await objectStorageClient.putObject(putObjectRequest);
    console.log(`Successfully uploaded OCI object: ${objectName}`);

    // 업로드 성공 후 객체 URL 생성 (실제 OCI URL 형식에 맞게 조정 필요)
    const objectUrl = `https://objectstorage.${regionId}.oraclecloud.com/n/${ociNamespace}/b/${ociBucketName}/o/${objectName}`;
    return objectUrl;
  } catch (error) {
    console.error(`Error uploading OCI object ${objectName}:`, error);
    throw new Error(`OCI 객체 업로드 중 오류 발생: ${objectName}`);
  }
}
