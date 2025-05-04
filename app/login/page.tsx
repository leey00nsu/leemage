import { LoginForm } from "@/features/auth/login/ui/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height))]">
      <LoginForm />
    </div>
  );
}
