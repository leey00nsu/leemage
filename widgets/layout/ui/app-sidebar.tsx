import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  BarChart3,
  Shield,
  User,
} from "lucide-react";
import { LogoutButton } from "@/features/auth/logout/ui/logout-button";
import { LanguageSelectorButton } from "@/features/language/ui/langauge-selector-button";
import { getTranslations } from "next-intl/server";

export interface AppSidebarProject {
  id: string;
  name: string;
}

interface AppSidebarProps {
  username: string;
  projects: AppSidebarProject[];
}

export async function AppSidebar({ username, projects }: AppSidebarProps) {
  const t = await getTranslations("AppSidebar");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-100 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo.webp"
            alt="Leemage"
            width={28}
            height={28}
            className="object-contain"
          />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Leemage
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <LayoutDashboard className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          {t("dashboard")}
        </Link>
        <Link
          href="/projects"
          className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <FolderOpen className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          {t("projects")}
        </Link>
        <Link
          href="/api-docs"
          className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <FileText className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          {t("apiDocs")}
        </Link>
        <Link
          href="/api"
          className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Shield className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          {t("apiSecurity")}
        </Link>
        <Link
          href="/monitoring"
          className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <BarChart3 className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          {t("logs")}
        </Link>

        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {t("projectsSection")}
          </p>
          {projects.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              {t("noProjects")}
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/${project.id}`}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title={project.name}
                >
                  <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 transition-colors" />
                  <span className="truncate">{project.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <User className="h-4 w-4 text-slate-500 dark:text-slate-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {username}
            </div>
            <Link
              href="/account"
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t("accountSettings")}
            </Link>
          </div>
        </div>
        <div className="mt-3">
          <LanguageSelectorButton className="w-full" />
        </div>
        <div className="mt-3">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
