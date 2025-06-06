import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { API_KEY_PREFIX } from "@/shared/config/api-key";

/**
 * API 요청 헤더에서 API 키를 추출하고 유효성을 검증합니다.
 * @param request NextRequest 객체
 * @returns 키가 유효하면 true, 그렇지 않으면 false 또는 에러 응답을 반환할 수 있습니다.
 */
export async function validateApiKey(request: NextRequest): Promise<boolean> {
  const authorizationHeader = request.headers.get("Authorization");

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    console.error("API Key: Authorization 헤더 누락 또는 형식 오류");
    return false;
  }

  const providedApiKey = authorizationHeader.substring(7); // "Bearer " 제거

  if (!providedApiKey || !providedApiKey.startsWith(API_KEY_PREFIX)) {
    console.error("API Key: 키 누락 또는 접두사 오류");
    return false;
  }

  try {
    // DB에서 해당 접두사를 가진 키 정보 조회 (해시값만)
    // 주의: 실제 환경에서는 prefix 인덱스를 활용하여 검색 효율을 높이는 것이 좋습니다.
    // 현재는 시스템당 키가 하나이므로 findFirst 사용
    const apiKeyData = await prisma.apiKey.findFirst({
      where: {
        prefix: API_KEY_PREFIX, // 접두사로 먼저 검색
      },
      select: {
        keyHash: true,
      },
    });

    if (!apiKeyData || !apiKeyData.keyHash) {
      console.error("API Key: 해당 접두사의 키를 찾을 수 없음");
      return false;
    }

    // 제공된 키와 저장된 해시 비교
    const isValid = await bcrypt.compare(providedApiKey, apiKeyData.keyHash);

    if (!isValid) {
      console.error("API Key: 키 검증 실패");
      return false;
    }

    // 유효한 경우, 마지막 사용 시각 업데이트 (선택 사항)
    /*
    await prisma.apiKey.updateMany({
      where: { prefix: API_KEY_PREFIX },
      data: { lastUsedAt: new Date() },
    });
    */

    console.log("API Key: 검증 성공");
    return true;
  } catch (error) {
    console.error("API Key 검증 중 오류 발생:", error);
    return false;
  }
}

/**
 * API 라우트 핸들러를 감싸 API 키 인증을 추가하는 HOF(Higher-Order Function)
 * Next.js App Router의 타입 시스템과 완전히 호환됩니다.
 * @param handler 보호할 API 라우트 핸들러
 * @returns 인증 로직이 추가된 새로운 핸들러
 */
export function withApiKeyAuth<T extends Record<string, string | string[]>>(
  handler: (
    req: NextRequest,
    context: { params: Promise<T> }
  ) => Promise<NextResponse> | NextResponse
) {
  return async (
    req: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    const isValid = await validateApiKey(req);
    if (!isValid) {
      return new NextResponse(
        JSON.stringify({ message: "인증 실패: 유효하지 않은 API 키" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    // 인증 성공 시 원래 핸들러 실행 (context 그대로 전달)
    return handler(req, context);
  };
}
