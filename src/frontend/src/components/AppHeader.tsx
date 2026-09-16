import { LoginButton } from "@/components/LoginButton";
import { Link } from "@tanstack/react-router";
import { CalendarDays, History, Users } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Partidos", icon: CalendarDays },
  { to: "/plantel", label: "Plantel", icon: Users },
  { to: "/historial", label: "Historial", icon: History },
] as const;

/** Encabezado fijo con la navegación principal del grupo. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card shadow-subtle">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg transition-smooth hover:opacity-90"
            data-ocid="nav.home_link"
          >
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-lg font-bold text-primary-foreground"
              aria-hidden="true"
            >
              ⚽
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-display text-xl font-bold tracking-tight">
                Fulbito del Barrio
              </span>
              <span className="text-sm text-muted-foreground">
                Organización del grupo
              </span>
            </span>
          </Link>
          <div className="lg:hidden">
            <LoginButton />
          </div>
        </div>

        <nav
          aria-label="Secciones principales"
          className="flex items-center gap-1"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-base font-semibold text-muted-foreground transition-smooth hover:bg-secondary hover:text-secondary-foreground lg:flex-none"
                activeProps={{
                  className:
                    "bg-secondary text-secondary-foreground shadow-subtle",
                }}
                data-ocid={`nav.${item.label.toLowerCase()}_link`}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
