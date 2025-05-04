"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// QueryClient 인스턴스 생성 (컴포넌트 외부에서 한번만 생성)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 기본 쿼리 옵션 설정 (선택 사항)
      staleTime: 1000 * 60 * 5, // 5분 동안 데이터 fresh 상태 유지
      refetchOnWindowFocus: false, // 창 포커스 시 자동 refetch 비활성화
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools (개발 시 유용) */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
