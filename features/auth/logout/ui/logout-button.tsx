"use client";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLogout } from "../model/logout";
import { useTranslations } from "next-intl";

export function LogoutButton() {
  const router = useRouter();
  const t = useTranslations("LogoutButton");

  const { mutate: logout, isPending: isLoggingOut } = useLogout({
    onSuccessCallback: () => {
      router.push("/auth/login");
      router.refresh();
    },
    onErrorCallback: (error) => {
      console.error("Logout error:", error);
      toast.error(t("logoutErrorToast"), {
        description: t("networkErrorToastDescription"),
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
          {t("loggingOutButton")}
        </>
      ) : (
        t("logoutButton")
      )}
    </Button>
  );
}
