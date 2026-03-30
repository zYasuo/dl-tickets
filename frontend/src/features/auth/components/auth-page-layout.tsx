import type { ReactNode } from "react";
import { AuthBrandMark } from "@/features/auth/components/auth-brand-mark";

type AuthPageLayoutProps = {
  children: ReactNode;
};

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/20 via-background to-background px-4"
    >
      <div className="w-full max-w-sm space-y-6">
        <AuthBrandMark />
        {children}
      </div>
    </div>
  );
}
