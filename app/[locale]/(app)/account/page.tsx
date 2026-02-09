import { getSessionDefault } from "@/lib/session";
import { AccountProfileDashboard } from "@/widgets/account/ui/account-profile-dashboard";

export default async function AccountPage() {
  const session = await getSessionDefault();

  return (
    <div className="min-h-[calc(100vh-var(--header-height)-1rem)] px-2 py-2 sm:px-0">
      <AccountProfileDashboard username={session.username} />
    </div>
  );
}
