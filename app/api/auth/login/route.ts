import { NextRequest } from "next/server";
import { loginHandler } from "@/lib/api/auth";

// POST 핸들러: 로그인
export const POST = async (req: NextRequest) => {
  return loginHandler(req);
};
