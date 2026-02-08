import type { Locale as DateFnsLocale } from "date-fns";
import { enUS, ko } from "date-fns/locale";

export function getDateFnsLocale(locale: string): DateFnsLocale {
  switch (locale) {
    case "ko":
      return ko;
    case "en":
    default:
      return enUS;
  }
}
