"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Menu,
  User,
  LayoutDashboard,
  FileText,
  BarChart3,
  Shield,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

interface MobileNavigationProps {
  labels: {
    menu: string;
    projectsLink: string;
    apiDocsLink: string;
    apiSecurityLink: string;
    logsLink: string;
    accountLink: string;
  };
}

export function MobileNavigation({ labels }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={labels.menu}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>{labels.menu}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 p-4">
          <Link
            href="/projects"
            onClick={handleLinkClick}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            {labels.projectsLink}
          </Link>
          <Link
            href="/api-docs"
            onClick={handleLinkClick}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <FileText className="h-4 w-4" />
            {labels.apiDocsLink}
          </Link>
          <Link
            href="/api"
            onClick={handleLinkClick}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Shield className="h-4 w-4" />
            {labels.apiSecurityLink}
          </Link>
          <Link
            href="/monitoring"
            onClick={handleLinkClick}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <BarChart3 className="h-4 w-4" />
            {labels.logsLink}
          </Link>
          <div className="my-2 border-t" />
          <Link
            href="/account"
            onClick={handleLinkClick}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <User className="h-4 w-4" />
            {labels.accountLink}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
