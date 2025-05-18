import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Loader2 } from "lucide-react";

export const ApiKeySkeleton = () => {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>API 키 관리</CardTitle>
        <CardDescription>API 키 정보를 불러오는 중...</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center min-h-[10rem]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
};
