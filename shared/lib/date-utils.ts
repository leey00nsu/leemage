import { format } from "date-fns";
import { useMemo } from "react";
import { useLocale } from "next-intl";

// 로케일별 date-fns 로케일 동적 import
export const getDateLocale = async (locale: string) => {
  switch (locale) {
    case "ko":
      return (await import("date-fns/locale/ko")).ko;
    case "en":
      return (await import("date-fns/locale/en-US")).enUS;
    default:
      return (await import("date-fns/locale/en-US")).enUS;
  }
};

// 로케일별 날짜 포맷 패턴
export const getDateFormatPattern = (locale: string): string => {
  switch (locale) {
    case "ko":
      return "yyyy년 MM월 dd일 HH:mm";
    default:
      return "MMM dd, yyyy HH:mm";
  }
};

// 날짜 포맷팅 함수
export const formatDate = async (
  date: Date,
  locale: string
): Promise<string> => {
  const dateLocale = await getDateLocale(locale);
  const formatPattern = getDateFormatPattern(locale);
  return format(date, formatPattern, { locale: dateLocale });
};

// 커스텀 훅: 현재 로케일에 맞는 날짜 포맷팅 함수 제공
export const useDateFormat = () => {
  const locale = useLocale();

  const dateFormatOptions = useMemo(
    () => ({
      formatDate: (date: Date) => formatDate(date, locale),
      getLocale: () => getDateLocale(locale),
      getFormatPattern: () => getDateFormatPattern(locale),
    }),
    [locale]
  );

  return dateFormatOptions;
};
