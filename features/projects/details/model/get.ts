import { useQuery } from "@tanstack/react-query";
import { getProjectDetails } from "../api/get";
import { projectKeys } from "../../model/query-keys";

export const useGetProjectDetails = (projectId: string) => {
  return useQuery({
    queryKey: projectKeys.byId(projectId),
    queryFn: () => getProjectDetails(projectId),
    enabled: !!projectId,
  });
};
