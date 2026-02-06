"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AppButton } from "@/shared/ui/app/app-button";
import { AppCard } from "@/shared/ui/app/app-card";
import { AppInput } from "@/shared/ui/app/app-input";
import { AppPageHeader } from "@/shared/ui/app/app-page-header";
import { AppTable, AppTableCard } from "@/shared/ui/app/app-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ApiKeyDisplay } from "@/entities/api-key/ui/api-key-display";
import { ApiKeyError } from "@/entities/api-key/ui/api-key-error";
import { ApiKeySkeleton } from "@/entities/api-key/ui/api-key-skeleton";
import { useListApiKeys } from "@/features/api-key/model/list";
import { useGenerateApiKey } from "@/features/api-key/model/generate";
import { useRevokeApiKey } from "@/features/api-key/model/revoke";
import { useRenameApiKey } from "@/features/api-key/model/rename";

const PAGE_SIZE = 5;

type ApiTab = "apiKeys" | "permissions" | "webhooks";

function formatDateTime(value: Date | string | null): string {
  if (!value) {
    return "-";
  }

  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function maskSecret(prefix: string): string {
  return `${prefix}••••••••`;
}

export function ApiSecurityDashboard() {
  const t = useTranslations("ApiSecurity");
  const [activeTab, setActiveTab] = useState<ApiTab>("apiKeys");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const { data: apiKeys, isLoading, error: queryError } = useListApiKeys();

  const {
    mutate: generateApiKey,
    isPending: isGenerating,
    error: generateError,
  } = useGenerateApiKey({
    onSuccessCallback: (newKey) => {
      setGeneratedKey(newKey);
      toast.success(t("keys.generateSuccessToast"));
    },
    onErrorCallback: (err) => {
      toast.error(
        err instanceof Error ? err.message : t("keys.generateErrorToast"),
      );
    },
  });

  const {
    mutate: revokeApiKey,
    isPending: isRevoking,
    error: revokeError,
  } = useRevokeApiKey({
    onSuccessCallback: () => {
      toast.success(t("keys.revokeSuccessToast"));
      setRevokeTargetId(null);
    },
    onErrorCallback: (err) => {
      toast.error(
        err instanceof Error ? err.message : t("keys.revokeErrorToast"),
      );
      setRevokeTargetId(null);
    },
  });

  const {
    mutate: renameApiKey,
    isPending: isRenaming,
    error: renameError,
  } = useRenameApiKey({
    onSuccessCallback: () => {
      toast.success(t("keys.renameSuccessToast"));
      setIsEditDialogOpen(false);
      setEditTargetId(null);
      setEditName("");
    },
    onErrorCallback: (err) => {
      toast.error(
        err instanceof Error ? err.message : t("keys.renameErrorToast"),
      );
    },
  });

  const error = queryError || generateError || revokeError || renameError;
  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? t("keys.unknownError")
        : null;

  const filteredKeys = useMemo(() => {
    const keys = apiKeys ?? [];
    const keyword = searchQuery.trim().toLowerCase();

    if (!keyword) {
      return keys;
    }

    return keys.filter((key) => {
      const name = key.name?.toLowerCase() ?? "";
      return (
        name.includes(keyword) || key.prefix.toLowerCase().includes(keyword)
      );
    });
  }, [apiKeys, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredKeys.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const visibleKeys = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredKeys.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredKeys]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleGenerate = () => {
    setGeneratedKey(null);
    generateApiKey();
  };

  const handleRevoke = (apiKeyId: string) => {
    setRevokeTargetId(apiKeyId);
    revokeApiKey(apiKeyId);
  };

  const handleOpenEdit = (apiKeyId: string, currentName: string | null) => {
    setEditTargetId(apiKeyId);
    setEditName(currentName ?? "");
    setIsEditDialogOpen(true);
  };

  const handleRename = () => {
    if (!editTargetId) {
      return;
    }

    renameApiKey({
      apiKeyId: editTargetId,
      name: editName,
    });
  };

  return (
    <div className="space-y-6">
      <AppPageHeader heading={t("heading")} description={t("subheading")} />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ApiTab)}
      >
        <div className="border-b border-gray-200 dark:border-gray-800">
          <TabsList className="h-auto rounded-none bg-transparent p-0 gap-4">
            <TabsTrigger
              value="apiKeys"
              className="rounded-none border-b-2 border-transparent px-1 py-3 text-sm font-medium text-slate-500 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {t("tabs.apiKeys")}
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className="rounded-none border-b-2 border-transparent px-1 py-3 text-sm font-medium text-slate-500 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {t("tabs.permissions")}
            </TabsTrigger>
            <TabsTrigger
              value="webhooks"
              className="rounded-none border-b-2 border-transparent px-1 py-3 text-sm font-medium text-slate-500 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {t("tabs.webhooks")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="apiKeys" className="space-y-4">
          {generatedKey ? <ApiKeyDisplay apiKey={generatedKey} /> : null}
          <ApiKeyError errorMessage={errorMessage} />

          {isLoading ? (
            <ApiKeySkeleton />
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <AppInput
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={t("keys.searchPlaceholder")}
                    className="pl-9"
                  />
                </div>
                <AppButton onClick={handleGenerate} disabled={isGenerating}>
                  <Plus className="h-4 w-4" />
                  {t("keys.createButton")}
                </AppButton>
              </div>

              <AppTableCard
                heading={t("keys.tableTitle")}
                footer={
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("keys.summary", {
                        shown: visibleKeys.length,
                        total: filteredKeys.length,
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      <AppButton
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage <= 1}
                      >
                        {t("keys.pagination.previous")}
                      </AppButton>
                      <AppButton
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        disabled={currentPage >= totalPages}
                      >
                        {t("keys.pagination.next")}
                      </AppButton>
                    </div>
                  </div>
                }
              >
                <AppTable>
                  <thead className="bg-gray-50/70 dark:bg-gray-800/20">
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("keys.columns.name")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("keys.columns.status")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("keys.columns.secret")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("keys.columns.lastUsed")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("keys.columns.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900">
                    {visibleKeys.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                        >
                          {searchQuery
                            ? t("keys.empty.filtered")
                            : t("keys.empty.default")}
                        </td>
                      </tr>
                    ) : (
                      visibleKeys.map((key) => (
                        <tr
                          key={key.id}
                          className="border-b border-gray-100 transition-colors hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-gray-800/30"
                        >
                          <td className="px-6 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {key.name ?? t("keys.unnamedKey")}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {t("keys.createdAt", {
                                  date: formatDateTime(key.createdAt),
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                              {t("keys.status.active")}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                            {maskSecret(key.prefix)}
                          </td>
                          <td className="px-6 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {key.lastUsedAt
                              ? formatDateTime(key.lastUsedAt)
                              : t("keys.neverUsed")}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <AppButton
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(key.id, key.name)}
                              >
                                {t("keys.actions.edit")}
                              </AppButton>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <AppButton variant="ghost" size="sm">
                                    {t("keys.actions.revoke")}
                                  </AppButton>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("keys.actions.revokeConfirmTitle")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t(
                                        "keys.actions.revokeConfirmDescription",
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isRevoking}>
                                      {t("keys.actions.cancel")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRevoke(key.id)}
                                      disabled={isRevoking}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      {isRevoking && revokeTargetId === key.id
                                        ? t("keys.actions.revoking")
                                        : t("keys.actions.confirmRevoke")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </AppTable>
              </AppTableCard>
            </>
          )}
        </TabsContent>

        <TabsContent value="permissions">
          <AppCard className="rounded-xl p-8">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("permissions.title")}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t("permissions.description")}
            </p>
          </AppCard>
        </TabsContent>

        <TabsContent value="webhooks">
          <AppCard className="rounded-xl p-8">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("webhooks.title")}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t("webhooks.description")}
            </p>
          </AppCard>
        </TabsContent>
      </Tabs>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditTargetId(null);
            setEditName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("keys.actions.editDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("keys.actions.editDialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="api-key-name"
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {t("keys.actions.editInputLabel")}
            </label>
            <AppInput
              id="api-key-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t("keys.unnamedKey")}
              maxLength={60}
              autoFocus
            />
          </div>

          <DialogFooter>
            <AppButton
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isRenaming}
            >
              {t("keys.actions.cancel")}
            </AppButton>
            <AppButton
              onClick={handleRename}
              disabled={isRenaming || !editTargetId}
            >
              {isRenaming
                ? t("keys.actions.editing")
                : t("keys.actions.confirmEdit")}
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
