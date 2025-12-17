"use client";

import { useState, useEffect } from "react";
import { Input } from "@/shared/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useTranslations } from "next-intl";

interface ProjectSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export function ProjectSearchInput({
  value,
  onChange,
  debounceMs = 300,
}: ProjectSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const t = useTranslations("ProjectSearch");

  // 외부 value가 변경되면 로컬 상태 동기화
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={t("placeholder")}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-9 pr-9"
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t("clear")}</span>
        </Button>
      )}
    </div>
  );
}
