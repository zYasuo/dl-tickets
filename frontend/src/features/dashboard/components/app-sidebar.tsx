"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut, Ticket, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/shared/components/ui/sidebar";

const nav = [
  {
    title: "Chamados",
    href: "/dashboard/tickets",
    icon: Ticket,
    match: (path: string) => path.startsWith("/dashboard/tickets"),
  },
] as const;

function isClienteGeoPath(path: string) {
  return (
    path.startsWith("/dashboard/clients/cidades") ||
    path.startsWith("/dashboard/clients/estados")
  );
}

function isClienteMainPath(path: string) {
  return path.startsWith("/dashboard/clients") && !isClienteGeoPath(path);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const prevPathRef = useRef(pathname);
  const [clienteMenuOpen, setClienteMenuOpen] = useState(() =>
    pathname.startsWith("/dashboard/clients"),
  );

  const clienteSectionActive = pathname.startsWith("/dashboard/clients");

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    const wasOutside = !prev.startsWith("/dashboard/clients");
    const nowInside = pathname.startsWith("/dashboard/clients");
    if (wasOutside && nowInside) setClienteMenuOpen(true);
  }, [pathname]);

  function closeMobileIfNeeded() {
    if (isMobile) setOpenMobile(false);
  }

  async function handleLogout() {
    try {
      await logout();
      toast.success("Sessão terminada");
      router.replace("/login");
    } catch {
      toast.error("Não foi possível sair. Tente novamente.");
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link
                  href="/dashboard"
                  onClick={closeMobileIfNeeded}
                  aria-label="Ir para o painel"
                />
              }
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Ticket className="size-4" aria-hidden />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">DL System</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Painel
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  onClick={() => setClienteMenuOpen((o) => !o)}
                  isActive={clienteSectionActive}
                  tooltip="Cliente"
                  className="w-full"
                  aria-expanded={clienteMenuOpen}
                >
                  <Users className="size-4" aria-hidden />
                  <span>Cliente</span>
                  <ChevronRight
                    className={cn(
                      "ms-auto size-4 shrink-0 transition-transform duration-200",
                      clienteMenuOpen && "rotate-90",
                    )}
                    aria-hidden
                  />
                </SidebarMenuButton>
                {clienteMenuOpen ? (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={isClienteMainPath(pathname)}
                        render={
                          <Link
                            href="/dashboard/clients"
                            onClick={closeMobileIfNeeded}
                          />
                        }
                      >
                        <span>Cliente</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith(
                          "/dashboard/clients/cidades",
                        )}
                        render={
                          <Link
                            href="/dashboard/clients/cidades"
                            onClick={closeMobileIfNeeded}
                          />
                        }
                      >
                        <span>Cidade</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith(
                          "/dashboard/clients/estados",
                        )}
                        render={
                          <Link
                            href="/dashboard/clients/estados"
                            onClick={closeMobileIfNeeded}
                          />
                        }
                      >
                        <span>Estado</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
              {nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={item.match(pathname)}
                    tooltip={item.title}
                    render={
                      <Link href={item.href} onClick={closeMobileIfNeeded} />
                    }
                  >
                    <item.icon className="size-4" aria-hidden />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              className="text-sidebar-foreground"
              onClick={() => void handleLogout()}
            >
              <LogOut className="size-4" aria-hidden />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
