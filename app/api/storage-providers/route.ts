import { getAvailableProvidersHandler } from "@/lib/api/storage-providers";
import { withSessionAuth } from "@/lib/auth/session-auth";

// GET 핸들러: 사용 가능한 스토리지 프로바이더 조회 (세션 기반 인증)
export const GET = withSessionAuth(async () => {
  return getAvailableProvidersHandler();
});
