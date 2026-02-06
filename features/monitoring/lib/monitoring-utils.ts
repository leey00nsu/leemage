export function createDateRange(days: number): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59
  );
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEndpoint(
  endpoint: string,
  metadata?: Record<string, unknown> | null
) {
  const fileName = metadata?.fileName as string | undefined;
  if (endpoint.includes("/files/presign")) {
    return fileName ? `${fileName} presign` : "Presign request";
  }
  if (endpoint.includes("/files/confirm")) {
    return fileName ? `${fileName} confirm` : "Confirm upload";
  }
  if (endpoint.includes("/files")) {
    return fileName ? `${fileName} file action` : "File request";
  }
  return endpoint.replace(/\/api\/(v1\/)?/, "").slice(0, 36);
}

