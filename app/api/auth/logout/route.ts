import { logoutHandler } from "@/lib/api/auth";

export async function POST() {
  return logoutHandler();
}
