"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Settings, Info } from "lucide-react";
import { useSetStorageQuota } from "../model/use-storage-quota";
import { gbToBytes, bytesToGb, validateQuota } from "@/shared/lib/storage-quota-utils";
import { toast } from "sonner";

// Free tier storage limits
const FREE_TIER_LIMITS: Record<string, { storage: string; note: string }> = {
    OCI: { storage: "10 GB", note: "20 GB total (first 10 GB free)" },
    R2: { storage: "10 GB", note: "10 GB/month free" },
};

interface QuotaSettingDialogProps {
    provider: "OCI" | "R2";
    currentQuota?: number;
    children?: React.ReactNode;
}

export function QuotaSettingDialog({
    provider,
    currentQuota,
    children,
}: QuotaSettingDialogProps) {
    const t = useTranslations("QuotaSettingDialog");
    const [open, setOpen] = useState(false);
    const [quotaGb, setQuotaGb] = useState(
        currentQuota ? bytesToGb(currentQuota).toString() : ""
    );
    const [error, setError] = useState("");

    const { mutate: setQuota, isPending } = useSetStorageQuota();

    const handleSave = () => {
        const value = parseFloat(quotaGb);

        if (isNaN(value) || !validateQuota(value)) {
            setError(t("invalidQuota"));
            return;
        }

        const quotaBytes = gbToBytes(value);

        setQuota(
            { provider, quotaBytes },
            {
                onSuccess: () => {
                    toast.success(t("saveSuccess"));
                    setOpen(false);
                    setError("");
                },
                onError: (err) => {
                    toast.error(err.message || t("saveError"));
                },
            }
        );
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen) {
            setQuotaGb(currentQuota ? bytesToGb(currentQuota).toString() : "");
            setError("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Settings className="h-3 w-3" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>
                        {t("description", { provider })}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="quota">{t("quotaLabel")}</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="quota"
                                type="number"
                                min="0"
                                step="0.1"
                                value={quotaGb}
                                onChange={(e) => {
                                    setQuotaGb(e.target.value);
                                    setError("");
                                }}
                                placeholder={t("quotaPlaceholder")}
                                className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground">GB</span>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>

                    {/* Free tier tip */}
                    {FREE_TIER_LIMITS[provider] && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                            <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                            <div className="text-muted-foreground">
                                <span className="font-medium">{t("freeTierTip")}: </span>
                                {provider === "OCI" ? t("ociFreeTier") : t("r2FreeTier")}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        {t("cancel")}
                    </Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? t("saving") : t("save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
