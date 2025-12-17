"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useTranslations } from "next-intl";
import { StorageProviderFilter } from "../model/filter";

interface ProjectFilterSelectProps {
  value: StorageProviderFilter;
  onChange: (value: StorageProviderFilter) => void;
}

export function ProjectFilterSelect({
  value,
  onChange,
}: ProjectFilterSelectProps) {
  const t = useTranslations("ProjectFilter");
  const tStorage = useTranslations("StorageProvider");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t("placeholder")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{t("all")}</SelectItem>
        <SelectItem value="OCI">{tStorage("OCI")}</SelectItem>
        <SelectItem value="R2">{tStorage("R2")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
