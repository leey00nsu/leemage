import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../api/get";
import { projectKeys } from "../../model/query-keys";

export const useGetProjects = () => {
  return useQuery({
    queryKey: projectKeys.all(),
    queryFn: getProjects,
  });
};
