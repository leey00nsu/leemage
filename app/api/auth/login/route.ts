import { NextRequest } from "next/server";
import { loginHandler } from "@/lib/api/auth";
import { withRateLimit, loginRateLimiter } from "@/lib/auth/rate-limiter";

// POST 핸들러: 로그인 (Rate Limiting 적용 - 5회/분, 15분 차단)
export const POST = withRateLimit(async (req: NextRequest) => {
  return loginHandler(req);
}, loginRateLimiter);
