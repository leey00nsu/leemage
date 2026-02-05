import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/sheet";
import { Button } from "@/shared/ui/button";
import { Link } from "@/i18n/navigation";

interface AppShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900">
        {sidebar}
      </aside>
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Link href="/dashboard" className="text-sm font-semibold">
            Leemage
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="h-full">{sidebar}</div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
