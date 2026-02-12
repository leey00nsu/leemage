import { useState } from "react";
import type { SdkTabId } from "./types";

interface UseApiDocsStateResult {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  activeSdkTab: SdkTabId;
  setActiveSdkTab: (value: SdkTabId) => void;
}

export function useApiDocsState(): UseApiDocsStateResult {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSdkTab, setActiveSdkTab] = useState<SdkTabId>("install");

  return {
    searchQuery,
    setSearchQuery,
    activeSdkTab,
    setActiveSdkTab,
  };
}
