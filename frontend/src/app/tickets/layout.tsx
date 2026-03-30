import type { ReactNode } from "react";
import { AppHeader } from "@/features/auth/components/app-header";
import { RequireAuth } from "@/features/auth/components/require-auth";

export default function TicketsLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className="flex min-h-dvh flex-col">
        <AppHeader />
        <main className="flex-1">{children}</main>
      </div>
    </RequireAuth>
  );
}
