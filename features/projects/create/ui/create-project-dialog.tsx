"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { CreateProjectForm } from "./create-project-form";

interface CreateProjectDialogProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CreateProjectDialog({
  children,
  defaultOpen = false,
}: CreateProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const t = useTranslations("CreateProjectForm");

  const [previousDefaultOpen, setPreviousDefaultOpen] = useState(defaultOpen);
  if (previousDefaultOpen !== defaultOpen) {
    setPreviousDefaultOpen(defaultOpen);
    if (defaultOpen) setIsOpen(true);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <CreateProjectForm
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
