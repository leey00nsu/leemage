import { getSessionDefault } from "@/lib/session"; // 서버 컴포넌트용 세션 함수
import { AccountCard } from "@/features/account/ui/account-card"; // AccountCard 임포트
import { ApiKeyManager } from "@/features/auth/api-key/ui/api-key-manager"; // ApiKeyManager 임포트 추가

export default async function AccountPage() {
  // 서버 컴포넌트에서 세션 정보 가져오기
  const session = await getSessionDefault();

  const username = session.username || "사용자 정보 없음";

  return (
    // items-center 유지, w-full 제거, mx-auto 추가하여 중앙 정렬
    <div className="flex flex-col items-center gap-8 py-10 px-4 min-h-[calc(100vh-var(--header-height)-1rem)]">
      <AccountCard username={username} />
      <ApiKeyManager />
    </div>
  );
}
