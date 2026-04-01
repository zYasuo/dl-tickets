"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment } from "react";
import { LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Separator } from "@/shared/components/ui/separator";
import { SidebarTrigger } from "@/shared/components/ui/sidebar";
import { cn } from "@/lib/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function segmentLabel(segment: string): string {
  if (segment === "dashboard") return "Visão geral";
  if (segment === "clients") return "Clientes";
  if (segment === "tickets") return "Chamados";
  if (segment === "settings") return "Configurações";
  if (segment === "new") return "Novo";
  if (segment === "edit") return "Editar";
  if (UUID_RE.test(segment)) return "Detalhe";
  return segment;
}

function hrefForSegments(endIndex: number, segments: string[]): string {
  return `/${segments.slice(0, endIndex + 1).join("/")}`;
}

function initialsFromEmail(email: string): string {
  const c = email.trim().charAt(0);
  return c ? c.toUpperCase() : "?";
}

const crumbLinkClass =
  "rounded-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const segments = pathname.split("/").filter(Boolean);

  async function handleLogout() {
    try {
      await logout();
      toast.success("Sessão terminada");
      router.replace("/login");
    } catch {
      toast.error("Não foi possível sair. Tenta novamente.");
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/60 px-3 backdrop-blur-sm sm:px-4 md:px-5">
      <SidebarTrigger className="-ml-1 shrink-0" aria-label="Abrir ou fechar menu lateral" />
      <Separator orientation="vertical" className="mr-2 h-14 shrink-0" />
      <nav
        aria-label="Localização"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-sm"
      >
        <Link href="/dashboard" className={crumbLinkClass}>
          Início
        </Link>
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          const label = segmentLabel(seg);
          return (
            <Fragment key={`${seg}-${i}`}>
              <span aria-hidden className="text-muted-foreground/50">
                /
              </span>
              {isLast ? (
                <span
                  className="truncate font-medium text-foreground"
                  aria-current="page"
                >
                  {label}
                </span>
              ) : (
                <Link
                  href={hrefForSegments(i, segments)}
                  className={cn(crumbLinkClass, "truncate")}
                >
                  {label}
                </Link>
              )}
            </Fragment>
          );
        })}
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "shrink-0 rounded-full outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
          aria-label="Menu da conta"
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
              {user ? initialsFromEmail(user.email) : "?"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="max-w-56 truncate font-normal text-muted-foreground">
              {user?.email ?? "Conta"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <Settings className="size-4 opacity-70" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                void handleLogout();
              }}
            >
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
