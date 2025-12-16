import { getAvailableProvidersHandler } from "@/lib/api/storage-providers";

export async function GET() {
  return getAvailableProvidersHandler();
}
