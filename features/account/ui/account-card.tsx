"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { LogoutButton } from "@/features/auth/logout/ui/logout-button";

interface AccountCardProps {
  username: string;
}

export function AccountCard({ username }: AccountCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">내 정보</CardTitle>
        <CardDescription>현재 로그인된 사용자 정보입니다.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <p>
            <span className="font-medium text-muted-foreground">
              사용자 이름:
            </span>{" "}
            {username}
          </p>
        </div>
        <LogoutButton />
      </CardContent>
    </Card>
  );
}
