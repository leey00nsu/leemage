import { useQuery } from "@tanstack/react-query";
import { apiKeyKeys } from "./query-keys";
import { getApiKeyInfo } from "../api/get";

export const useGetApiKeyInfo = () => {
  // API 키 정보 조회 (useQuery)
  return useQuery({
    queryKey: apiKeyKeys.all(),
    queryFn: getApiKeyInfo,
  });
};
