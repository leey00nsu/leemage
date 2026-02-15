import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { pickMessages } from "@/shared/lib/i18n/pick-messages";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages({ locale });
  const authMessages = pickMessages(messages, ["LoginForm", "Validation"]);

  return (
    <NextIntlClientProvider locale={locale} messages={authMessages}>
      {children}
    </NextIntlClientProvider>
  );
}
