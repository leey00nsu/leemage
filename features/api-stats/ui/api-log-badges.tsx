interface MethodBadgeProps {
  method: string;
}

interface StatusBadgeProps {
  statusCode: number;
}

export function MethodBadge({ method }: MethodBadgeProps) {
  const colors: Record<string, string> = {
    GET: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    POST: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    DELETE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    PUT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    PATCH: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs rounded font-mono ${
        colors[method] ||
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      }`}
    >
      {method}
    </span>
  );
}

export function StatusBadge({ statusCode }: StatusBadgeProps) {
  const isClientError = statusCode >= 400 && statusCode < 500;
  const isServerError = statusCode >= 500;

  let colorClass =
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
  let dotColor = "bg-green-500";

  if (isClientError) {
    colorClass =
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    dotColor = "bg-yellow-500";
  } else if (isServerError) {
    colorClass = "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    dotColor = "bg-red-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded ${colorClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {statusCode}
    </span>
  );
}
