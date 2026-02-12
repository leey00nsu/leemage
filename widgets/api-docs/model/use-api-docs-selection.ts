import { useMemo } from "react";
import type {
  ActiveItemKey,
  FlattenedEndpoint,
} from "@/entities/api-docs/model/navigation";
import { flattenApiDocs } from "@/entities/api-docs/model/navigation";
import type { ApiCategory } from "@/entities/api-docs/model/types";
import { getEndpointDisplayPath } from "./endpoint-path";
import type { StaticDocItem } from "./types";

interface UseApiDocsSelectionParams {
  apiDocs: ApiCategory[];
  activeItemKey: ActiveItemKey;
  searchQuery: string;
  staticDocs: StaticDocItem[];
}

interface UseApiDocsSelectionResult {
  filteredCategories: ApiCategory[];
  flattenedEndpoints: FlattenedEndpoint[];
  selectedStaticDoc: StaticDocItem | null;
  selectedEndpoint: FlattenedEndpoint | null;
  previousEndpoint: FlattenedEndpoint | null;
  nextEndpoint: FlattenedEndpoint | null;
}

export function useApiDocsSelection({
  apiDocs,
  activeItemKey,
  searchQuery,
  staticDocs,
}: UseApiDocsSelectionParams): UseApiDocsSelectionResult {
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return apiDocs;
    }

    return apiDocs
      .map((category) => {
        const isCategoryMatch = category.name.toLowerCase().includes(query);
        const matchedEndpoints = category.endpoints.filter((endpoint) => {
          return [
            endpoint.method,
            endpoint.path,
            getEndpointDisplayPath(endpoint),
            endpoint.description,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        });

        if (isCategoryMatch) {
          return category;
        }

        return {
          ...category,
          endpoints: matchedEndpoints,
        };
      })
      .filter((category) => category.endpoints.length > 0);
  }, [apiDocs, searchQuery]);

  const allFlattenedEndpoints = useMemo<FlattenedEndpoint[]>(
    () => flattenApiDocs(apiDocs),
    [apiDocs],
  );

  const flattenedEndpoints = useMemo<FlattenedEndpoint[]>(
    () => flattenApiDocs(filteredCategories),
    [filteredCategories],
  );

  const selectedStaticDoc = useMemo(
    () => staticDocs.find((doc) => doc.key === activeItemKey) ?? null,
    [activeItemKey, staticDocs],
  );

  const selectedEndpoint = useMemo(
    () => allFlattenedEndpoints.find((item) => item.key === activeItemKey) ?? null,
    [activeItemKey, allFlattenedEndpoints],
  );

  const selectedEndpointIndex = selectedEndpoint
    ? allFlattenedEndpoints.findIndex((item) => item.key === selectedEndpoint.key)
    : -1;

  const previousEndpoint =
    selectedEndpointIndex > 0
      ? allFlattenedEndpoints[selectedEndpointIndex - 1]
      : null;

  const nextEndpoint =
    selectedEndpointIndex >= 0 &&
    selectedEndpointIndex < allFlattenedEndpoints.length - 1
      ? allFlattenedEndpoints[selectedEndpointIndex + 1]
      : null;

  return {
    filteredCategories,
    flattenedEndpoints,
    selectedStaticDoc,
    selectedEndpoint,
    previousEndpoint,
    nextEndpoint,
  };
}
