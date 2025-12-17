import { getSessionDefault } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSessionDefault();

  return NextResponse.json({
    isLoggedIn: session.isLoggedIn ?? false,
    username: session.username ?? null,
  });
}
