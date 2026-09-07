"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AppButton } from "@/shared/ui/app/app-button";
import { AppInput } from "@/shared/ui/app/app-input";
import { AppSelect } from "@/shared/ui/app/app-select";
import { Checkbox } from "@/shared/ui/checkbox";
import { Badge } from "@/shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/ui/alert-dialog";
import { projectKeys } from "@/features/projects/model/query-keys";
import type { ProjectTag } from "@/shared/lib/project-tags";

async function request<T>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok)
    throw new Error(response.status === 409 ? "duplicate" : "error");
  return response.json();
}
const tagKey = (id: string) => ["project-tags", id];
export function useProjectTags(projectId: string) {
  return useQuery({
    queryKey: tagKey(projectId),
    queryFn: () => request<ProjectTag[]>(`/api/projects/${projectId}/tags`),
  });
}

function TagRow({
  tag,
  busy,
  run,
}: {
  tag: ProjectTag;
  busy: boolean;
  run: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const t = useTranslations("Tags");
  const [name, setName] = useState(tag.name);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <AppInput
        aria-label={t("renameLabel", { name: tag.name })}
        value={name}
        maxLength={40}
        disabled={busy}
        onChange={(e) => setName(e.target.value)}
        className="min-w-0 flex-1"
      />
      <AppButton
        variant="outline"
        size="sm"
        disabled={busy || !name.trim() || name.trim() === tag.name}
        onClick={() =>
          void run(() =>
            request(`/api/projects/${tag.projectId}/tags/${tag.id}`, "PUT", {
              name,
            }),
          )
        }
      >
        {t("save")}
      </AppButton>
      <AlertDialog
        open={confirm}
        onOpenChange={(value) => {
          if (!busy) setConfirm(value);
        }}
      >
        <AlertDialogTrigger asChild>
          <AppButton size="sm" variant="ghost" disabled={busy}>
            {t("delete")}
          </AppButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteTitle", { name: tag.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("deleteHint")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void run(() =>
                  request(
                    `/api/projects/${tag.projectId}/tags/${tag.id}`,
                    "DELETE",
                  ),
                );
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function TagsDialog({
  projectId,
  fileIds,
  disabled = false,
}: {
  projectId: string;
  fileIds?: string[];
  disabled?: boolean;
}) {
  const t = useTranslations("Tags");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const { data: tags = [], isLoading, error } = useProjectTags(projectId);
  const client = useQueryClient();
  const router = useRouter();
  const run = async (action: () => Promise<unknown>, close = false) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      await Promise.all([
        client.invalidateQueries({ queryKey: tagKey(projectId) }),
        client.invalidateQueries({ queryKey: projectKeys.byId(projectId) }),
      ]);
      router.refresh();
      toast.success(t("success"));
      if (close) setOpen(false);
    } catch (e) {
      toast.error(
        t(
          e instanceof Error && e.message === "duplicate"
            ? "duplicate"
            : "error",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const selected = chosen.filter((id) => tags.some((tag) => tag.id === id));
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) {
          setOpen(value);
          setChosen([]);
          setName("");
        }
      }}
    >
      <DialogTrigger asChild>
        <AppButton
          variant="outline"
          size="sm"
          disabled={disabled || (fileIds !== undefined && !fileIds.length)}
        >
          {t(fileIds ? "editFiles" : "manage")}
        </AppButton>
      </DialogTrigger>
      <DialogContent
        showCloseButton={!busy}
        className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle>{t(fileIds ? "editFiles" : "manage")}</DialogTitle>
          <DialogDescription>
            {fileIds
              ? t("batchHint", { count: fileIds.length })
              : t("projectHint")}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto p-1">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim())
                void run(async () => {
                  await request(`/api/projects/${projectId}/tags`, "POST", {
                    name,
                  });
                  setName("");
                });
            }}
          >
            <AppInput
              aria-label={t("newName")}
              placeholder={t("newName")}
              value={name}
              maxLength={40}
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0"
            />
            <AppButton type="submit" disabled={busy || !name.trim()}>
              {t("create")}
            </AppButton>
          </form>
          {isLoading && <p role="status">{t("loading")}</p>}
          {error && (
            <p role="alert" className="text-destructive">
              {t("error")}
            </p>
          )}
          {!isLoading && !error && !tags.length && (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          )}
          <div className="space-y-2">
            {tags.map((tag) =>
              fileIds ? (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer"
                >
                  <Checkbox
                    disabled={
                      busy ||
                      (selected.length >= 50 && !selected.includes(tag.id))
                    }
                    checked={selected.includes(tag.id)}
                    onCheckedChange={(value) =>
                      setChosen((prev) =>
                        value
                          ? [...prev, tag.id]
                          : prev.filter((id) => id !== tag.id),
                      )
                    }
                  />
                  <span className="break-all text-sm">{tag.name}</span>
                </label>
              ) : (
                <TagRow
                  key={`${tag.id}:${tag.name}`}
                  tag={tag}
                  busy={busy}
                  run={run}
                />
              ),
            )}
          </div>
        </div>
        {fileIds && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t pt-4">
            {(["remove", "add"] as const).map((operation) => (
              <AppButton
                key={operation}
                variant={operation === "add" ? "default" : "outline"}
                disabled={busy || !selected.length || !!error}
                onClick={() =>
                  void run(
                    () =>
                      request(`/api/projects/${projectId}/files/tags`, "PUT", {
                        fileIds,
                        tagIds: selected,
                        operation,
                      }),
                    true,
                  )
                }
              >
                {t(operation)}
              </AppButton>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function TagFilter({
  projectId,
  selected,
  mode,
  onChange,
}: {
  projectId: string;
  selected: string[];
  mode: string;
  onChange: (key: string, value: string) => void;
}) {
  const t = useTranslations("Tags");
  const { data: tags = [], error } = useProjectTags(projectId);
  return (
    <div data-selection-ignore className="mb-6 space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-sm font-medium">{t("filter")}</span>
        {selected.length > 0 && (
          <>
            <AppButton
              size="sm"
              variant="ghost"
              onClick={() => onChange("tags", "")}
            >
              {t("clear")}
            </AppButton>
            <AppSelect
              aria-label={t("match")}
              value={mode}
              onChange={(value) => onChange("tagMode", value)}
              options={[
                { value: "all", label: t("all") },
                { value: "any", label: t("any") },
              ]}
            />
          </>
        )}
        <TagsDialog projectId={projectId} />
      </div>
      {error ? (
        <p className="text-sm text-destructive">{t("error")}</p>
      ) : (
        <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto p-1">
          {!tags.length && (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          )}
          {tags.map((tag) => (
            <AppButton
              key={tag.id}
              size="sm"
              variant={selected.includes(tag.id) ? "default" : "outline"}
              aria-pressed={selected.includes(tag.id)}
              disabled={selected.length >= 50 && !selected.includes(tag.id)}
              className="max-w-full"
              onClick={() =>
                onChange(
                  "tags",
                  (selected.includes(tag.id)
                    ? selected.filter((id) => id !== tag.id)
                    : [...selected, tag.id]
                  ).join(","),
                )
              }
            >
              <span className="truncate">{tag.name}</span>
            </AppButton>
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTagSection({
  projectId,
  fileId,
  tags = [],
}: {
  projectId: string;
  fileId: string;
  tags?: ProjectTag[];
}) {
  const t = useTranslations("Tags");
  return (
    <section className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("filter")}</h3>
        <TagsDialog projectId={projectId} fileIds={[fileId]} />
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.length ? (
          tags.map((tag) => (
            <Badge
              variant="secondary"
              key={tag.id}
              className="max-w-full break-all"
            >
              {tag.name}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">{t("noTags")}</span>
        )}
      </div>
    </section>
  );
}
