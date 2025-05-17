import { getSessionDefault } from "@/lib/session";
import { AccountCard } from "@/features/account/ui/account-card";
import { ApiKeyManager } from "@/features/api-key/ui/api-key-manager";

export default async function AccountPage() {
  // 서버 컴포넌트에서 세션 정보 가져오기
  const session = await getSessionDefault();

  const username = session.username || "사용자 정보 없음";

  return (
    <div className="flex flex-col items-center gap-8 py-10 px-4 min-h-[calc(100vh-var(--header-height)-1rem)]">
      <AccountCard username={username} />
      <ApiKeyManager />
    </div>
  );
}
