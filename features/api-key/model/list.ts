import { useQuery } from "@tanstack/react-query";
import { apiKeyKeys } from "./query-keys";
import { listApiKeys } from "../api/list";

export const useListApiKeys = () => {
  return useQuery({
    queryKey: apiKeyKeys.all(),
    queryFn: listApiKeys,
  });
};
