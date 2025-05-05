import { getSessionDefault } from "@/lib/session"; // 서버 컴포넌트용 세션 함수
import { AccountCard } from "@/features/account/ui/account-card"; // AccountCard 임포트

export default async function AccountPage() {
  // 서버 컴포넌트에서 세션 정보 가져오기
  const session = await getSessionDefault();

  const username = session.username || "사용자 정보 없음";

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-var(--header-height)-1rem)]">
      <AccountCard username={username} />
    </div>
  );
}
