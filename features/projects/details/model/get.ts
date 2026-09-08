import { useQuery } from "@tanstack/react-query";
import { getProjectDetails } from "../api/get";
import { projectKeys } from "../../model/query-keys";

export const useGetProjectDetails = (projectId: string, query = "") => {
  return useQuery({
    queryKey: [...projectKeys.byId(projectId), "assets", query],
    queryFn: ({ signal }) => getProjectDetails(projectId, query, signal),
    placeholderData: (previous) =>
      previous?.id === projectId ? previous : undefined,
    refetchInterval: (query) =>
      query.state.data?.files.some(
        (file) =>
          file.processingStatus === "QUEUED" ||
          file.processingStatus === "RUNNING",
      )
        ? 3000
        : false,
    enabled: !!projectId,
  });
};
