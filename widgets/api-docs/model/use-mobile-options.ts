import { useMemo } from "react";
import type { AppSelectOption } from "@/shared/ui/app/app-select";
import type { ActiveItemKey, FlattenedEndpoint } from "@/entities/api-docs/model/navigation";
import { getEndpointDisplayPath } from "./endpoint-path";
import type { StaticDocItem } from "./types";

interface UseMobileOptionsParams {
  activeItemKey: ActiveItemKey;
  staticDocs: StaticDocItem[];
  flattenedEndpoints: FlattenedEndpoint[];
  selectedEndpoint: FlattenedEndpoint | null;
  selectedStaticDoc: StaticDocItem | null;
  getSectionLabel: (section: StaticDocItem["section"]) => string;
  fallbackTitle: string;
}

export function useMobileOptions({
  activeItemKey,
  staticDocs,
  flattenedEndpoints,
  selectedEndpoint,
  selectedStaticDoc,
  getSectionLabel,
  fallbackTitle,
}: UseMobileOptionsParams): AppSelectOption[] {
  return useMemo(() => {
    const staticOptions = staticDocs.map((doc) => ({
      value: doc.key,
      label: `${getSectionLabel(doc.section)} · ${doc.title}`,
    }));

    const endpointOptions = flattenedEndpoints.map((item) => ({
      value: item.key,
      label: `${item.endpoint.method} ${getEndpointDisplayPath(item.endpoint)}`,
    }));

    const all = [...staticOptions, ...endpointOptions];

    if (!all.some((option) => option.value === activeItemKey)) {
      all.unshift({
        value: activeItemKey,
        label: selectedEndpoint
          ? `${selectedEndpoint.endpoint.method} ${getEndpointDisplayPath(selectedEndpoint.endpoint)}`
          : selectedStaticDoc?.title ?? fallbackTitle,
      });
    }

    return all;
  }, [
    activeItemKey,
    fallbackTitle,
    flattenedEndpoints,
    getSectionLabel,
    selectedEndpoint,
    selectedStaticDoc,
    staticDocs,
  ]);
}
