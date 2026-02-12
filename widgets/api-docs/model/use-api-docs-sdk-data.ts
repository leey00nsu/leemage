import { useMemo } from "react";
import { getEndpointSdkExample } from "@/entities/api-docs/model/endpoint-sdk-examples";
import type { FlattenedEndpoint } from "@/entities/api-docs/model/navigation";
import {
  getSdkCodeExamples,
  type SdkCodeExample,
} from "@/entities/sdk/model/code-examples";
import { RATE_LIMIT_CONFIG } from "@/shared/config/rate-limit";
import type { ApiDocsRateLimitRow } from "./types";

interface UseApiDocsSdkDataParams {
  locale: "ko" | "en";
  selectedEndpoint: FlattenedEndpoint | null;
  tRaw: (key: string) => string;
}

interface UseApiDocsSdkDataResult {
  sdkCodeExamples: SdkCodeExample[];
  sdkExampleForEndpoint: { code: string; language: string } | null;
  rateLimitRows: ApiDocsRateLimitRow[];
}

export function useApiDocsSdkData({
  locale,
  selectedEndpoint,
  tRaw,
}: UseApiDocsSdkDataParams): UseApiDocsSdkDataResult {
  const sdkCodeExamples = useMemo(() => getSdkCodeExamples(locale), [locale]);

  const sdkExampleForEndpoint = useMemo(() => {
    if (!selectedEndpoint) {
      return null;
    }

    return getEndpointSdkExample(
      selectedEndpoint.endpoint.method,
      selectedEndpoint.endpoint.path,
      locale,
    );
  }, [locale, selectedEndpoint]);

  const rateLimitRows: ApiDocsRateLimitRow[] = useMemo(
    () => [
      {
        scope: tRaw("docs.rateLimits.rows.api.scope"),
        ...RATE_LIMIT_CONFIG.api,
      },
      {
        scope: tRaw("docs.rateLimits.rows.uploadConfirm.scope"),
        ...RATE_LIMIT_CONFIG.uploadConfirm,
      },
      {
        scope: tRaw("docs.rateLimits.rows.login.scope"),
        ...RATE_LIMIT_CONFIG.login,
      },
    ],
    [tRaw],
  );

  return {
    sdkCodeExamples,
    sdkExampleForEndpoint,
    rateLimitRows,
  };
}
