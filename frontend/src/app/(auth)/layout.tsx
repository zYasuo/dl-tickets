import type { ReactNode } from "react";
import { AuthPageLayout } from "@/features/auth/components/auth-page-layout";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthPageLayout>{children}</AuthPageLayout>;
}
