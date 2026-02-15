import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale, locale }) => {
  // `locale`가 명시되면 우선 사용하고, 없을 때만 requestLocale을 조회합니다.
  const requested = locale ?? (await requestLocale);
  const resolvedLocale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default,
  };
});
