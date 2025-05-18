import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

interface ApiKeyErrorProps {
  errorMessage: string | null;
}

export function ApiKeyError({ errorMessage }: ApiKeyErrorProps) {
  if (!errorMessage) return null;

  return (
    <Alert variant="destructive">
      <AlertTitle>오류 발생</AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
}
