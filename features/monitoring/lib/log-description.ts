import type { LogEntry } from "@/features/api-stats/model/types";

type Translate = (key: string, values?: Record<string, string>) => string;

function getMetadataString(log: LogEntry, key: string): string | null {
  const value = log.metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function stripQuery(endpoint: string): string {
  const [path] = endpoint.split("?");
  return path;
}

export function buildMonitoringLogDescription(log: LogEntry, t: Translate): string {
  const endpoint = stripQuery(log.endpoint);
  const fileName = getMetadataString(log, "fileName") ?? t("table.events.unknownFile");

  const presignMatch = endpoint.match(
    /^\/api(?:\/v1)?\/projects\/([^/]+)\/files\/presign$/,
  );
  if (presignMatch) {
    return t("table.events.filePresign", {
      projectId: presignMatch[1],
      fileName,
    });
  }

  const confirmMatch = endpoint.match(
    /^\/api(?:\/v1)?\/projects\/([^/]+)\/files\/confirm$/,
  );
  if (confirmMatch) {
    return t("table.events.fileConfirm", {
      projectId: confirmMatch[1],
      fileName,
    });
  }

  if (/^\/api(?:\/v1)?\/projects$/.test(endpoint)) {
    if (log.method === "GET") return t("table.events.projectList");
    if (log.method === "POST") return t("table.events.projectCreate");
  }

  const projectDetailMatch = endpoint.match(/^\/api(?:\/v1)?\/projects\/([^/]+)$/);
  if (projectDetailMatch) {
    const projectId = projectDetailMatch[1];
    if (log.method === "GET") return t("table.events.projectRead", { projectId });
    if (log.method === "PATCH" || log.method === "PUT") {
      return t("table.events.projectUpdate", { projectId });
    }
    if (log.method === "DELETE") return t("table.events.projectDelete", { projectId });
  }

  const fileDeleteMatch = endpoint.match(
    /^\/api(?:\/v1)?\/projects\/([^/]+)\/files\/([^/]+)$/,
  );
  if (fileDeleteMatch && log.method === "DELETE") {
    return t("table.events.fileDelete", {
      projectId: fileDeleteMatch[1],
      fileId: fileDeleteMatch[2],
    });
  }

  return t("table.events.default", { method: log.method, endpoint });
}
