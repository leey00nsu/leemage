import Image from "next/image";

import { cn } from "@/shared/lib/utils";

interface AppLogoProps {
  size?: number;
  alt?: string;
  className?: string;
  priority?: boolean;
}

export function AppLogo({
  size = 24,
  alt = "Leemage",
  className,
  priority = false,
}: AppLogoProps) {
  return (
    <Image
      src="/cloudy.png"
      alt={alt}
      width={size}
      height={size}
      className={cn("object-contain", className)}
      priority={priority}
    />
  );
}
