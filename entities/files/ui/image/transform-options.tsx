"use client";

import { useTranslations } from "next-intl";
import { AppButton } from "@/shared/ui/app/app-button";
import { AppSelect } from "@/shared/ui/app/app-select";
import { Input } from "@/shared/ui/input";
import { AVAILABLE_FORMATS } from "@/shared/config/image-options";
import type { ImageTransformRequest } from "@/shared/lib/image-transform-plan";

export function TransformOptions({
  variants,
  onChange,
  disabled,
}: {
  variants: ImageTransformRequest[];
  onChange: (variants: ImageTransformRequest[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("UploadOptions");
  const update = (index: number, patch: Partial<ImageTransformRequest>) =>
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  return (
    <section className="space-y-3">
      {variants.length > 0 && <h3 className="font-medium">{t("additional")}</h3>}
      {variants.map((variant, index) => {
        const mode =
          variant.sizeLabel === "source"
            ? "source"
            : variant.sizeLabel.startsWith("max")
              ? "width"
              : variant.fit === "cover"
                ? "cover"
                : "inside";
        const [width, height] = variant.sizeLabel.startsWith("max")
          ? [variant.sizeLabel.slice(3), ""]
          : variant.sizeLabel.split("x");
        return (
          <fieldset
            key={index}
            disabled={disabled}
            className="rounded-lg border p-3 space-y-3"
          >
            <legend className="px-1 text-sm">
              {t("variant", { count: index + 1 })}
            </legend>
            <div className="flex flex-wrap gap-2">
              <AppSelect
                aria-label={t("mode")}
                value={mode}
                disabled={disabled}
                onChange={(v) =>
                  update(index, {
                    sizeLabel:
                      v === "source"
                        ? "source"
                        : v === "width"
                          ? "max800"
                          : "800x600",
                    fit: v === "cover" ? "cover" : "inside",
                  })
                }
                options={["width", "inside", "cover", "source"].map(
                  (value) => ({ value, label: t(value) }),
                )}
              />
              <AppSelect
                aria-label={t("format")}
                value={variant.format}
                disabled={disabled}
                onChange={(format) =>
                  update(index, {
                    format: format as ImageTransformRequest["format"],
                  })
                }
                options={AVAILABLE_FORMATS.map((value) => ({
                  value,
                  label: value.toUpperCase(),
                }))}
              />
            </div>
            {mode !== "source" && (
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-xs space-y-1">
                  {t("widthLabel")}
                  <Input
                    aria-label={t("widthLabel")}
                    className="w-28"
                    type="number"
                    min={1}
                    max={10000}
                    value={width}
                    onChange={(e) =>
                      update(index, {
                        sizeLabel:
                          mode === "width"
                            ? `max${e.target.value}`
                            : `${e.target.value}x${height}`,
                      })
                    }
                  />
                </label>
                {mode !== "width" && (
                  <label className="text-xs space-y-1">
                    {t("heightLabel")}
                    <Input
                      aria-label={t("heightLabel")}
                      className="w-28"
                      type="number"
                      min={1}
                      max={10000}
                      value={height}
                      onChange={(e) =>
                        update(index, {
                          sizeLabel: `${width}x${e.target.value}`,
                        })
                      }
                    />
                  </label>
                )}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {t(`${mode}Hint`)}
              </p>
              <AppButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(variants.filter((_, i) => i !== index))}
              >
                {t("remove")}
              </AppButton>
            </div>
          </fieldset>
        );
      })}
      <AppButton
        type="button"
        variant="outline"
        disabled={disabled || variants.length >= 20}
        onClick={() =>
          onChange([...variants, { sizeLabel: "max800", format: "webp" }])
        }
      >
        {t("add")}
      </AppButton>
    </section>
  );
}
