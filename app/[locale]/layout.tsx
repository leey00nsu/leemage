import type { Metadata } from "next";
import "../globals.css"; // 경로 수정
import { PageLayout } from "@/widgets/layout/ui/page-layout";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "@/shared/ui/sonner";
import localFont from "next/font/local";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

const pretendard = localFont({
  src: "../../public/PretendardVariable.woff2", // 경로 수정
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "Leemage", // 정적 메타데이터 예시
  description: "Leemage Project",
};

export default async function RootLayout({
  children,
  params, // 타입 변경: Promise<{locale: string}>
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params; // await 제거 (또는 params 타입을 Promise로 변경 후 await 사용)
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={`${pretendard.variable}`}>
      <body className={pretendard.className}>
        <NextIntlClientProvider locale={locale}>
          <QueryProvider>
            <PageLayout>{children}</PageLayout>
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
