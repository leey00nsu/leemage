import React from "react";
import { Header } from "./header"; // Import Header widget
import { Footer } from "./footer"; // Import Footer widget

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Main Content */}
      <main className="flex-grow container mx-auto p-4">{children}</main>

      <Footer />
    </div>
  );
}
