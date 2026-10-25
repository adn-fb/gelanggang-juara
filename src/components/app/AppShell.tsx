import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";

const nav = [
  { to: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
  { to: "/profil", label: "Profil", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[240px_1fr]">
      <aside className="flex items-center justify-between gap-4 bg-sidebar px-4 py-3 text-sidebar-foreground md:sticky md:top-0 md:h-screen md:flex-col md:items-stretch md:justify-start md:px-3 md:py-5">
        <Logo className="px-2 text-sidebar-accent-foreground" />
        <nav aria-label="Navigasi utama" className="flex gap-1 md:mt-8 md:flex-col">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
            >
              <Icon className="size-4" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:mt-auto md:justify-start"
        >
          <LogOut aria-hidden /> <span className="hidden sm:inline">Keluar</span>
        </Button>
      </aside>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">{children}</main>
    </div>
  );
}
