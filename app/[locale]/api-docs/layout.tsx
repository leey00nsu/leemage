import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { pickMessages } from "@/shared/lib/i18n/pick-messages";

export const revalidate = 3600;

export default async function ApiDocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages =
    locale === "en"
      ? (await import("@/messages/en.json")).default
      : (await import("@/messages/ko.json")).default;
  const apiDocsMessages = pickMessages(messages, [
    "ApiDocsView",
    "SdkQuickStart",
    "EndpointCard",
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={apiDocsMessages}>
      {children}
    </NextIntlClientProvider>
  );
}
