"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLogout } from "../model/logout";

export function LogoutButton() {
  const router = useRouter();

  const { mutate: logout, isPending: isLoggingOut } = useLogout({
    onSuccessCallback: () => {
      router.push("/auth/login");
      router.refresh();
    },
    onErrorCallback: (error) => {
      console.error("Logout error:", error);
      toast.error("로그아웃 오류", {
        description: "네트워크 또는 서버 문제일 수 있습니다.",
      });
    },
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <Button onClick={handleLogout} disabled={isLoggingOut} className="w-full">
      {isLoggingOut ? (
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
