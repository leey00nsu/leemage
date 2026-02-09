"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Copy, Plus, Search } from "lucide-react";
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
import { Checkbox } from "@/shared/ui/checkbox";
import { ApiKeyError } from "@/entities/api-key/ui/api-key-error";
import { ApiSecurityKeysSkeleton } from "@/features/api-security/ui/api-security-keys-skeleton";
import { useListApiKeys } from "@/features/api-key/model/list";
import { useGenerateApiKey } from "@/features/api-key/model/generate";
import { useRevokeApiKey } from "@/features/api-key/model/revoke";
import { useRenameApiKey } from "@/features/api-key/model/rename";
import {
  API_KEY_PERMISSIONS,
  DEFAULT_API_KEY_PERMISSIONS,
  type ApiKeyPermission,
} from "@/shared/config/api-key-permissions";

const PAGE_SIZE = 5;
const MAX_API_KEY_NAME_LENGTH = 60;

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
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPermissions, setCreatePermissions] = useState<ApiKeyPermission[]>(
    DEFAULT_API_KEY_PERMISSIONS,
  );
  const [draftApiKey, setDraftApiKey] = useState<string | null>(null);
  const [isGeneratedKeySaved, setIsGeneratedKeySaved] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPermissions, setEditPermissions] = useState<ApiKeyPermission[]>(
    DEFAULT_API_KEY_PERMISSIONS,
  );

  const resetCreateModalState = () => {
    setIsCreateDialogOpen(false);
    setCreateName("");
    setCreatePermissions(DEFAULT_API_KEY_PERMISSIONS);
    setDraftApiKey(null);
    setIsGeneratedKeySaved(false);
  };

  const { data: apiKeys, isLoading, error: queryError } = useListApiKeys();

  const {
    mutate: createApiKey,
    isPending: isCreatingApiKey,
    error: createError,
  } = useGenerateApiKey({
    onSuccessCallback: (newApiKey) => {
      setDraftApiKey(newApiKey);
      setIsGeneratedKeySaved(false);
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
      setEditPermissions(DEFAULT_API_KEY_PERMISSIONS);
    },
    onErrorCallback: (err) => {
      toast.error(
        err instanceof Error ? err.message : t("keys.renameErrorToast"),
      );
    },
  });

  const error = queryError || createError || revokeError || renameError;
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

  const handleOpenCreateDialog = () => {
    setCreateName("");
    setCreatePermissions(DEFAULT_API_KEY_PERMISSIONS);
    setDraftApiKey(null);
    setIsGeneratedKeySaved(false);
    setIsCreateDialogOpen(true);
  };

  const handleCreatePermissionChange = (
    permission: ApiKeyPermission,
    checked: boolean,
  ) => {
    if (checked) {
      setCreatePermissions((prev) =>
        prev.includes(permission) ? prev : [...prev, permission],
      );
      return;
    }

    setCreatePermissions((prev) => prev.filter((item) => item !== permission));
  };

  const handleCopyGeneratedKey = async () => {
    if (!draftApiKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(draftApiKey);
      toast.success(t("keys.revealModal.copySuccess"));
    } catch {
      toast.error(t("keys.revealModal.copyError"));
    }
  };

  const handleConfirmGeneratedKey = () => {
    if (!draftApiKey) {
      createApiKey({
        name: createName,
        permissions: createPermissions,
      });
      return;
    }

    resetCreateModalState();
    toast.success(t("keys.generateSuccessToast"));
  };

  const handleRevoke = (apiKeyId: string) => {
    setRevokeTargetId(apiKeyId);
    revokeApiKey(apiKeyId);
  };

  const handleOpenEdit = (
    apiKeyId: string,
    currentName: string | null,
    currentPermissions: ApiKeyPermission[],
  ) => {
    setEditTargetId(apiKeyId);
    setEditName(currentName ?? "");
    setEditPermissions(
      currentPermissions.length > 0
        ? currentPermissions
        : DEFAULT_API_KEY_PERMISSIONS,
    );
    setIsEditDialogOpen(true);
  };

  const handleEditPermissionChange = (
    permission: ApiKeyPermission,
    checked: boolean,
  ) => {
    if (checked) {
      setEditPermissions((prev) =>
        prev.includes(permission) ? prev : [...prev, permission],
      );
      return;
    }

    setEditPermissions((prev) => prev.filter((item) => item !== permission));
  };

  const handleRename = () => {
    if (!editTargetId) {
      return;
    }

    renameApiKey({
      apiKeyId: editTargetId,
      name: editName,
      permissions: editPermissions,
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
          <TabsList className="h-auto gap-4 rounded-none bg-transparent p-0">
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
          <ApiKeyError errorMessage={errorMessage} />

          {isLoading ? (
            <ApiSecurityKeysSkeleton />
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
                <AppButton onClick={handleOpenCreateDialog}>
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
                <AppTable className="min-w-[980px]">
                  <thead className="bg-gray-50/70 dark:bg-gray-800/20">
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("keys.columns.name")}
                      </th>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("keys.columns.status")}
                      </th>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("keys.columns.secret")}
                      </th>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("keys.columns.lastUsed")}
                      </th>
                      <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                          <td className="min-w-[280px] px-6 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {key.name ?? t("keys.unnamedKey")}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {t("keys.createdAt", {
                                  date: formatDateTime(key.createdAt),
                                })}
                              </span>
                              <div className="flex flex-wrap gap-1 pt-1">
                                {key.permissions.map((permission) => (
                                  <span
                                    key={`${key.id}-${permission}`}
                                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                  >
                                    {t(`keys.permissions.${permission}`)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-3">
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                              {t("keys.status.active")}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                            {maskSecret(key.prefix)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {key.lastUsedAt
                              ? formatDateTime(key.lastUsedAt)
                              : t("keys.neverUsed")}
                          </td>
                          <td className="whitespace-nowrap px-6 py-3 text-right">
                            <div className="flex min-w-fit items-center justify-end gap-2">
                              <AppButton
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleOpenEdit(
                                    key.id,
                                    key.name,
                                    key.permissions,
                                  )
                                }
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

        <TabsContent value="permissions" className="space-y-4">
          <AppCard className="rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("permissions.guideTitle")}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t("permissions.guideDescription")}
            </p>

            <div className="mt-5 space-y-3">
              {API_KEY_PERMISSIONS.map((permission) => (
                <div
                  key={`permission-guide-${permission}`}
                  className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t(`keys.permissions.${permission}`)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t(`permissions.items.${permission}.description`)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {t(`permissions.items.${permission}.risk`)}
                  </span>
                </div>
              ))}
            </div>
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
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open && isCreatingApiKey) {
            return;
          }

          if (!open) {
            resetCreateModalState();
          } else {
            setIsCreateDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {draftApiKey
                ? t("keys.revealModal.title")
                : t("keys.createModal.title")}
            </DialogTitle>
            <DialogDescription>
              {draftApiKey
                ? t("keys.revealModal.warningDescription")
                : t("keys.createModal.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="text-sm text-amber-900 dark:text-amber-100">
                  <p className="font-semibold">
                    {t("keys.revealModal.warningTitle")}
                  </p>
                  <p className="mt-1">
                    {t("keys.revealModal.warningDescription")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="new-api-key-name"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t("keys.createModal.nameLabel")}
              </label>
              <AppInput
                id="new-api-key-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={t("keys.createModal.namePlaceholder")}
                maxLength={MAX_API_KEY_NAME_LENGTH}
                autoFocus
                disabled={isCreatingApiKey || Boolean(draftApiKey)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("keys.createModal.permissionsLabel")}
              </p>
              <div className="space-y-2">
                {API_KEY_PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <span className="min-w-0">
                      <span className="block text-slate-700 dark:text-slate-200">
                        {t(`keys.permissions.${permission}`)}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                        {t(`keys.createModal.permissionDescriptions.${permission}`)}
                      </span>
                    </span>
                    <Checkbox
                      checked={createPermissions.includes(permission)}
                      disabled={isCreatingApiKey || Boolean(draftApiKey)}
                      onCheckedChange={(checked) =>
                        handleCreatePermissionChange(permission, checked === true)
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            {draftApiKey && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("keys.revealModal.secretLabel")}
                </label>
                <div className="flex items-stretch gap-2">
                  <div className="min-w-0 flex-1 break-all rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm leading-relaxed text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200">
                    {draftApiKey}
                  </div>
                  <AppButton
                    variant="outline"
                    className="h-auto px-3"
                    onClick={handleCopyGeneratedKey}
                    aria-label={t("keys.revealModal.copyButton")}
                    disabled={!draftApiKey}
                  >
                    <Copy className="h-4 w-4" />
                  </AppButton>
                </div>
              </div>
            )}

            {draftApiKey && (
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <Checkbox
                  checked={isGeneratedKeySaved}
                  disabled={isCreatingApiKey}
                  onCheckedChange={(checked) =>
                    setIsGeneratedKeySaved(checked === true)
                  }
                />
                {t("keys.revealModal.acknowledge")}
              </label>
            )}
          </div>

          <DialogFooter>
            <AppButton
              variant="outline"
              onClick={resetCreateModalState}
              disabled={isCreatingApiKey}
            >
              {t("keys.actions.cancel")}
            </AppButton>
            <AppButton
              onClick={handleConfirmGeneratedKey}
              disabled={
                isCreatingApiKey ||
                createPermissions.length === 0 ||
                (draftApiKey ? !isGeneratedKeySaved : false)
              }
            >
              {isCreatingApiKey
                ? t("keys.createModal.creating")
                : draftApiKey
                  ? t("keys.revealModal.doneButton")
                  : t("keys.createModal.createButton")}
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditTargetId(null);
            setEditName("");
            setEditPermissions(DEFAULT_API_KEY_PERMISSIONS);
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
              maxLength={MAX_API_KEY_NAME_LENGTH}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("keys.createModal.permissionsLabel")}
            </p>
            <div className="space-y-2">
              {API_KEY_PERMISSIONS.map((permission) => (
                <label
                  key={`edit-${permission}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <span className="min-w-0">
                    <span className="block text-slate-700 dark:text-slate-200">
                      {t(`keys.permissions.${permission}`)}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      {t(`keys.createModal.permissionDescriptions.${permission}`)}
                    </span>
                  </span>
                  <Checkbox
                    checked={editPermissions.includes(permission)}
                    disabled={isRenaming}
                    onCheckedChange={(checked) =>
                      handleEditPermissionChange(permission, checked === true)
                    }
                  />
                </label>
              ))}
            </div>
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
              disabled={isRenaming || !editTargetId || editPermissions.length === 0}
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
