import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/utils";

// Paint focus above the card contents, inside its rounded boundary. An inset
// shadow on the link itself would be hidden by the card's opaque background.
export function AppCardLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "relative block rounded-lg outline-none after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-primary",
        className,
      )}
      {...props}
    />
  );
}
