"use client";

import { Badge } from "@/shared/ui/badge";
import { StorageProvider, STORAGE_PROVIDER_LABELS } from "@/lib/storage/types";
import { Cloud, Database } from "lucide-react";

interface StorageProviderBadgeProps {
  provider: StorageProvider | string;
  showLabel?: boolean;
  size?: "sm" | "default";
}

const providerIcons: Record<StorageProvider, React.ReactNode> = {
  [StorageProvider.OCI]: <Database className="h-3 w-3" />,
  [StorageProvider.R2]: <Cloud className="h-3 w-3" />,
};

const providerVariants: Record<StorageProvider, "default" | "secondary" | "outline"> = {
  [StorageProvider.OCI]: "default",
  [StorageProvider.R2]: "secondary",
};

export function StorageProviderBadge({
  provider,
  showLabel = true,
  size = "default",
}: StorageProviderBadgeProps) {
  const storageProvider = provider as StorageProvider;
  const icon = providerIcons[storageProvider] || <Database className="h-3 w-3" />;
  const variant = providerVariants[storageProvider] || "outline";
  const label = STORAGE_PROVIDER_LABELS[storageProvider] || provider;

  return (
    <Badge
      variant={variant}
      className={`gap-1 ${size === "sm" ? "text-xs px-1.5 py-0.5" : ""}`}
    >
      {icon}
      {showLabel && <span>{label}</span>}
    </Badge>
  );
}
