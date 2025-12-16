import { NextResponse } from "next/server";
import { StorageFactory } from "@/lib/storage";

export interface AvailableProvidersResponse {
  providers: string[];
}

export async function getAvailableProvidersHandler(): Promise<
  NextResponse<AvailableProvidersResponse>
> {
  const providers = await StorageFactory.getAvailableProviders();
  return NextResponse.json({ providers });
}
