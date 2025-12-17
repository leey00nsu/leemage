"use client";

import { useState, useEffect } from "react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Plus, Lock } from "lucide-react";
import {
  validateCustomResolution,
  formatCustomResolution,
} from "@/features/files/upload/model/schema";
import { useTranslations } from "next-intl";

interface CustomResolutionInputProps {
  onAdd: (resolution: string) => void;
  disabled?: boolean;
  currentCount?: number;
  maxCount?: number;
  originalWidth?: number;
  originalHeight?: number;
}

export function CustomResolutionInput({
  onAdd,
  disabled = false,
  currentCount = 0,
  maxCount = 10,
  originalWidth,
  originalHeight,
}: CustomResolutionInputProps) {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("CustomResolution");

  const isMaxReached = currentCount >= maxCount;
  const hasOriginalDimensions = originalWidth && originalHeight && originalWidth > 0 && originalHeight > 0;
  const aspectRatio = hasOriginalDimensions ? originalWidth / originalHeight : 1;

  // width 변경 시 height 자동 계산 (비율 유지)
  useEffect(() => {
    if (hasOriginalDimensions && width) {
      const widthNum = parseInt(width, 10);
      if (!isNaN(widthNum) && widthNum > 0) {
        const calculatedHeight = Math.round(widthNum / aspectRatio);
        setHeight(calculatedHeight.toString());
      }
    }
  }, [width, hasOriginalDimensions, aspectRatio]);

  const handleAdd = () => {
    setError(null);

    const widthNum = parseInt(width, 10);
    const heightNum = parseInt(height, 10);

    if (isNaN(widthNum) || isNaN(heightNum)) {
      setError(t("invalidNumber"));
      return;
    }

    const result = validateCustomResolution(widthNum, heightNum);
    if (!result.success) {
      setError(result.error);
      return;
    }

    const resolution = formatCustomResolution(widthNum, heightNum);
    onAdd(resolution);
    setWidth("");
    setHeight("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder={t("widthPlaceholder")}
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isMaxReached}
          className="w-24"
          min={1}
          max={10000}
        />
        <span className="text-muted-foreground">×</span>
        <div className="relative">
          <Input
            type="number"
            placeholder={t("heightPlaceholder")}
            value={height}
            onChange={(e) => !hasOriginalDimensions && setHeight(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isMaxReached || hasOriginalDimensions}
            className={`w-24 ${hasOriginalDimensions ? "pr-8 bg-muted/50" : ""}`}
            min={1}
            max={10000}
            readOnly={hasOriginalDimensions}
          />
          {hasOriginalDimensions && (
            <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || isMaxReached || !width || !height}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {hasOriginalDimensions && (
        <p className="text-xs text-muted-foreground">{t("aspectRatioLocked")}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {isMaxReached && (
        <p className="text-xs text-muted-foreground">{t("maxReached")}</p>
      )}
    </div>
  );
}
