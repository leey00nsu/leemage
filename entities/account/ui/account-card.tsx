"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { LogoutButton } from "@/features/auth/logout/ui/logout-button";
import { useTranslations } from "next-intl";

interface AccountCardProps {
  username: string;
}

export function AccountCard({ username }: AccountCardProps) {
  const t = useTranslations("AccountCard");
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <p>
            <span className="font-medium text-muted-foreground">
              {t("usernameLabel")}
            </span>
            {username}
          </p>
        </div>
        <LogoutButton />
      </CardContent>
    </Card>
  );
}
