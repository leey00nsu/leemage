import React from "react";
import Link from "next/link";

interface PageLayoutProps {
  children: React.ReactNode;
}

// 헤더의 높이를 정의합니다. 필요에 따라 조정하세요.
const HEADER_HEIGHT = "65px"; // 예: 64px 높이 + 1px 테두리

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header
        className="p-4 border-b sticky top-0 bg-background z-10"
        style={{ height: `var(--header-height, ${HEADER_HEIGHT})` }} // 기본값 설정
      >
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold">
            Leemage
          </Link>
          <nav className="flex items-center space-x-4">
            <Link
              href="/projects"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              프로젝트
            </Link>
            <Link
              href="/account"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              내 정보
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto p-4">{children}</main>

      {/* TODO: Add Footer */}
      <footer className="p-4 border-t mt-auto">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © 2025 Leemage. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
