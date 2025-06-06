import { NextRequest } from "next/server";
import { loginHandler } from "@/lib/api/auth";

export async function POST(req: NextRequest) {
  return loginHandler(req);
}
