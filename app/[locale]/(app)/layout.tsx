import { LandingHeader } from "@/widgets/landing/ui/landing-header";
import { LandingFooter } from "@/widgets/landing/ui/landing-footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow container mx-auto p-4">{children}</main>
      <LandingFooter />
    </div>
  );
}
