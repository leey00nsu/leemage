"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ShieldCheck, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { LogoutButton } from "@/features/auth/logout/ui/logout-button";
import { ThemeSelector } from "@/features/theme/ui/theme-selector";
import { StorageUsageCard } from "@/features/storage-usage/ui/storage-usage-card";
import { AppButton } from "@/shared/ui/app/app-button";
import { AppCard } from "@/shared/ui/app/app-card";
import { AppCheckbox } from "@/shared/ui/app/app-checkbox";
import { AppInput } from "@/shared/ui/app/app-input";
import { AppPageHeader } from "@/shared/ui/app/app-page-header";
import { AppSelect } from "@/shared/ui/app/app-select";
import { AppSwitch } from "@/shared/ui/app/app-switch";

interface AccountProfileDashboardProps {
  username?: string;
}

const TIMEZONE_OPTIONS = [
  { value: "America/Los_Angeles", label: "(GMT-08:00) Pacific Time" },
  { value: "America/New_York", label: "(GMT-05:00) Eastern Time" },
  { value: "Asia/Seoul", label: "(GMT+09:00) Seoul" },
  { value: "UTC", label: "(GMT+00:00) UTC" },
];

export function AccountProfileDashboard({ username }: AccountProfileDashboardProps) {
  const t = useTranslations("AccountProfile");

  const inferredEmail = useMemo(() => {
    if (username?.includes("@")) {
      return username;
    }
    return t("fallbackEmail");
  }, [t, username]);

  const [name, setName] = useState(username ?? t("fallbackName"));
  const [email, setEmail] = useState(inferredEmail);
  const [timezone] = useState("Asia/Seoul");
  const notifyProductUpdates = true;
  const notifyWeeklyDigest = false;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
      <AppPageHeader
        heading={t("title")}
        description={t("description")}
        actions={<LogoutButton />}
      />
      <p className="text-sm text-amber-700 dark:text-amber-400">
        {t("comingSoonNotice")}
      </p>

      <AppCard className="rounded-2xl p-6 md:p-8">
        <div className="mb-6 flex items-center gap-2">
          <UserRound className="h-5 w-5 text-slate-500 dark:text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("accountInformation.title")}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FieldBlock label={t("accountInformation.nameLabel")}>
            <AppInput
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled
            />
          </FieldBlock>
          <FieldBlock label={t("accountInformation.emailLabel")}>
            <AppInput
              value={email}
              type="email"
              onChange={(event) => setEmail(event.target.value)}
              disabled
            />
          </FieldBlock>
          <FieldBlock
            label={t("accountInformation.timezoneLabel")}
            className="md:col-span-2 md:max-w-md"
          >
            <AppSelect
              value={timezone}
              onChange={() => {}}
              options={TIMEZONE_OPTIONS}
              className="w-full"
              aria-label={t("accountInformation.timezoneLabel")}
              disabled
            />
          </FieldBlock>
        </div>
      </AppCard>

      <AppCard className="rounded-2xl p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-slate-500 dark:text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("security.title")}
            </h2>
          </div>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400">
            {t("security.secureBadge")}
          </span>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {t("security.passwordTitle")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("security.passwordDescription")}
              </p>
            </div>
            <AppButton variant="outline" size="sm" disabled>
              {t("security.updatePassword")}
            </AppButton>
          </div>
          <div className="border-t border-gray-100 pt-6 dark:border-gray-800">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {t("security.twoFactorTitle")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("security.twoFactorDescription")}
                </p>
              </div>
              <AppSwitch checked={false} disabled />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t("security.twoFactorNote")}
            </p>
          </div>
        </div>
      </AppCard>

      <AppCard className="rounded-2xl p-6 md:p-8">
        <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
          {t("preferences.title")}
        </h2>
        <div className="space-y-7">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {t("preferences.themeTitle")}
            </p>
            <ThemeSelector mode="buttons" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("preferences.themeDescription")}
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {t("preferences.notificationsTitle")}
            </p>
            <label className="flex cursor-pointer items-start gap-3 rounded-md px-1 py-1.5">
              <AppCheckbox
                checked={notifyProductUpdates}
                onCheckedChange={() => {}}
                disabled
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {t("preferences.productUpdates")}
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md px-1 py-1.5">
              <AppCheckbox
                checked={notifyWeeklyDigest}
                onCheckedChange={() => {}}
                disabled
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {t("preferences.weeklyDigest")}
              </span>
            </label>
          </div>
        </div>
      </AppCard>

      <AppCard className="rounded-2xl p-6 md:p-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("workspace.title")}
        </h2>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {t("workspace.name")}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("workspace.plan")} · {t("workspace.role")}
          </p>
          <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            {t("workspace.userIdLabel")}: {username ?? "-"}
          </p>
        </div>
      </AppCard>

      <StorageUsageCard className="w-full rounded-2xl" />

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <AppButton type="button" variant="ghost" className="justify-start sm:justify-center" disabled>
          {t("deactivateAccount")}
        </AppButton>
        <AppButton type="button" disabled>
          {t("actions.saveComingSoon")}
        </AppButton>
      </div>
    </div>
  );
}

interface FieldBlockProps {
  children: ReactNode;
  className?: string;
  label: string;
}

function FieldBlock({ label, children, className }: FieldBlockProps) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}
