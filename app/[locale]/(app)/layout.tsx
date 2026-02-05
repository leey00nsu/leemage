import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionDefault } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/widgets/layout/ui/app-shell";
import { AppSidebar } from "@/widgets/layout/ui/app-sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const session = await getSessionDefault();

  if (!session.username) {
    redirect({ href: "/auth/login", locale });
  }
  const username = session.username!;

  const projects = await prisma.project.findMany({
    where: { userId: username },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <AppShell
      sidebar={<AppSidebar username={username} projects={projects} />}
    >
      {children}
    </AppShell>
  );
}
