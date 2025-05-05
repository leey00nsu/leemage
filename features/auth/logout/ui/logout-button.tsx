"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("로그아웃 성공", {
          description: "로그인 페이지로 이동합니다.",
        });
        router.push("/auth/login");
        router.refresh();
      } else {
        const errorData = await response.json();
        toast.error("로그아웃 실패", {
          description: errorData.message || "로그아웃 중 오류가 발생했습니다.",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("로그아웃 오류", {
        description: "네트워크 또는 서버 문제일 수 있습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleLogout} disabled={isLoading} className="w-full">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          로그아웃 중...
        </>
      ) : (
        "로그아웃"
      )}
    </Button>
  );
}
