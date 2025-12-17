import type { Metadata } from "next";
import "../globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "@/shared/ui/sonner";
import localFont from "next/font/local";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

const pretendard = localFont({
  src: "../../public/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "Leemage",
  description: "Upload everything on Leemage",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={`${pretendard.variable}`}>
      <body className={pretendard.className}>
        <NextIntlClientProvider locale={locale}>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
