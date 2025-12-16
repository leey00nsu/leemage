import { StorageProvider } from "@/lib/storage/types";

export interface AvailableProvidersResponse {
  providers: StorageProvider[];
}

export const getAvailableStorageProviders =
  async (): Promise<AvailableProvidersResponse> => {
    const response = await fetch("/api/storage-providers");

    if (!response.ok) {
      throw new Error("스토리지 프로바이더 목록을 가져오는데 실패했습니다.");
    }

    return response.json();
  };
