import { NextResponse } from "next/server";
import { checkReadiness } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkReadiness();

  return NextResponse.json(
    {
      status: result.ready ? "ready" : "unavailable",
      checkedAt: result.checkedAt,
    },
    {
      status: result.ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
