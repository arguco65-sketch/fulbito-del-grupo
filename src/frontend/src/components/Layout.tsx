import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import type { ReactNode } from "react";

/** Estructura compartida: encabezado fijo, contenido y pie de página. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 bg-background" data-ocid="page.main">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
