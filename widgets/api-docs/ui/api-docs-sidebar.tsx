import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type {
  ActiveItemKey,
  FlattenedEndpoint,
} from "@/entities/api-docs/model/navigation";
import { getHrefByActiveKey } from "@/entities/api-docs/model/navigation";
import type { ApiCategory } from "@/entities/api-docs/model/types";
import { LanguageSelectorButton } from "@/features/language/ui/langauge-selector-button";
import { AppInput } from "@/shared/ui/app/app-input";
import { AppLogo } from "@/shared/ui/app/app-logo";
import { AppMethodBadge } from "@/shared/ui/app/app-method-badge";
import { getEndpointDisplayPath } from "@/widgets/api-docs/model/endpoint-path";
import type { StaticDocItem } from "@/widgets/api-docs/model/types";

interface ApiDocsSidebarProps {
  activeItemKey: ActiveItemKey;
  staticDocs: StaticDocItem[];
  filteredCategories: ApiCategory[];
  flattenedEndpoints: FlattenedEndpoint[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

export function ApiDocsSidebar({
  activeItemKey,
  staticDocs,
  filteredCategories,
  flattenedEndpoints,
  searchQuery,
  onSearchQueryChange,
}: ApiDocsSidebarProps) {
  const t = useTranslations("ApiDocsView");

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-50 lg:flex lg:flex-col dark:border-slate-800 dark:bg-slate-900/60">
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <Link href="/" className="mb-3 inline-flex items-center gap-2">
          <AppLogo size={24} />
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Leemage
          </span>
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {t("sidebarBadge")}
        </p>
        <h2 className="mt-1 text-base font-bold">{t("sidebarTitle")}</h2>
      </div>

      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <AppInput
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <div className="space-y-2">
          <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("sections.gettingStarted")}
          </h3>
          <ul className="space-y-1 border-l border-slate-200 pl-2 dark:border-slate-800">
            {staticDocs
              .filter((doc) => doc.section === "gettingStarted")
              .map((doc) => (
                <li key={doc.key}>
                  <Link
                    href={getHrefByActiveKey(doc.key)}
                    className={`block w-full rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                      activeItemKey === doc.key
                        ? "bg-white text-slate-900 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    {doc.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("sections.sdk")}
          </h3>
          <ul className="space-y-1 border-l border-slate-200 pl-2 dark:border-slate-800">
            {staticDocs
              .filter((doc) => doc.section === "sdk")
              .map((doc) => (
                <li key={doc.key}>
                  <Link
                    href={getHrefByActiveKey(doc.key)}
                    className={`block w-full rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                      activeItemKey === doc.key
                        ? "bg-white text-slate-900 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    {doc.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("sections.endpoints")}
          </h3>
          {filteredCategories.map((category) => (
            <div key={category.name} className="space-y-2">
              <h4 className="px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {category.name}
              </h4>
              <ul className="space-y-1 border-l border-slate-200 pl-2 dark:border-slate-800">
                {flattenedEndpoints
                  .filter((item) => item.categoryName === category.name)
                  .map((item) => (
                    <li key={item.key}>
                      <Link
                        href={getHrefByActiveKey(item.key)}
                        className={`block w-full rounded-md px-2.5 py-2 text-left transition-colors ${
                          activeItemKey === item.key
                            ? "bg-white text-slate-900 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <AppMethodBadge method={item.endpoint.method} />
                          <span className="truncate text-xs font-medium">
                            {getEndpointDisplayPath(item.endpoint)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                          {item.endpoint.description}
                        </p>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <LanguageSelectorButton className="w-full" />
      </div>
    </aside>
  );
}
