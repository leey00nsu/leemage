"use client";

interface FileGridProps {
  children: React.ReactNode;
  className?: string;
}

export function FileGrid({ children, className = "" }: FileGridProps) {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${className}`}
    >
      {children}
    </div>
  );
}
