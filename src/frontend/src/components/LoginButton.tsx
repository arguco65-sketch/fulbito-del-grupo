import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIdentity } from "@/hooks/use-identity";
import { LogIn, LogOut, ShieldCheck, UserRound } from "lucide-react";

/**
 * Control de acceso del grupo. Muestra el estado de sesión y el rol efectivo
 * (organizador o jugador) y permite iniciar o cerrar sesión.
 */
export function LoginButton() {
  const {
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isOrganizer,
    role,
    login,
    logout,
  } = useIdentity();

  if (isInitializing) {
    return (
      <Button variant="outline" disabled data-ocid="auth.loading_state">
        Cargando sesión…
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        onClick={() => login()}
        disabled={isLoggingIn}
        data-ocid="auth.login_button"
        className="gap-2"
      >
        <LogIn className="size-5" aria-hidden="true" />
        {isLoggingIn ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isOrganizer ? "default" : "secondary"}
        className="gap-1.5 px-3 py-1.5 text-sm"
        data-ocid="auth.role_badge"
      >
        {isOrganizer ? (
          <ShieldCheck className="size-4" aria-hidden="true" />
        ) : (
          <UserRound className="size-4" aria-hidden="true" />
        )}
        {role === "organizer" ? "Organizador" : "Jugador"}
      </Badge>
      <Button
        variant="outline"
        onClick={logout}
        data-ocid="auth.logout_button"
        className="gap-2"
      >
        <LogOut className="size-5" aria-hidden="true" />
        <span className="hidden sm:inline">Cerrar sesión</span>
        <span className="sr-only sm:hidden">Cerrar sesión</span>
      </Button>
    </div>
  );
}
