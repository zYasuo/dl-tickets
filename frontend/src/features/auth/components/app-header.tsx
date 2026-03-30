"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

function initialsFromEmail(email: string): string {
  const c = email.trim().charAt(0);
  return c ? c.toUpperCase() : "?";
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
      toast.success("Signed out");
      router.replace("/login");
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link
          href="/tickets"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground hover:text-primary"
        >
          <Ticket className="size-5" aria-hidden />
          DL Tickets
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "icon",
                className:
                  "size-8 rounded-full bg-primary p-0 text-xs font-medium text-primary-foreground hover:bg-primary/90",
              }),
            )}
            aria-label="Account menu"
          >
            {user ? initialsFromEmail(user.email) : "?"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="max-w-48 truncate text-xs font-normal text-muted-foreground">
                {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  void handleLogout();
                }}
              >
                <LogOut className="size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
