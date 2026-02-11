import { Link } from "@/i18n/navigation";
import { LoginForm } from "@/features/auth/login/ui/login-form";
import { AppLogo } from "@/shared/ui/app/app-logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="mb-6 flex items-center justify-center">
        <AppLogo size={64} priority />
      </Link>
      <LoginForm />
    </div>
  );
}
