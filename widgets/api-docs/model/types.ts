import type { StaticDocKey } from "@/entities/api-docs/model/navigation";

export type StaticDocSection = "gettingStarted" | "sdk";
export type SdkTabId = "install" | "init" | "upload" | "projects";

export interface StaticDocItem {
  key: StaticDocKey;
  section: StaticDocSection;
  title: string;
  summary: string;
  paragraphs: string[];
  bullets?: string[];
  requestExample?: string;
  responseExample?: string;
}

export interface ApiDocsRateLimitRow {
  scope: string;
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}
