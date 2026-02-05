"use client";

interface FileGridProps {
  children: React.ReactNode;
  className?: string;
}

export function FileGrid({ children, className = "" }: FileGridProps) {
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 ${className}`}
    >
      {children}
    </div>
  );
}
