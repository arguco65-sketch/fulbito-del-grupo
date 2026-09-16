import { MatchCard } from "@/components/MatchCard";
import { MatchFormDialog } from "@/components/MatchFormDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendanceSummary, useUpcomingMatches } from "@/hooks/use-backend";
import { useIdentity } from "@/hooks/use-identity";
import type { MatchView } from "@/types/app";
import { CalendarPlus, CalendarX2, RefreshCw } from "lucide-react";
import { useState } from "react";

const SKELETON_IDS = Array.from(
  { length: 3 },
  (_, index) => `match-skeleton-${index}`,
);

interface MatchRow {
  match: MatchView;
  confirmedCount: number;
  spotsLeft: number;
  isFull: boolean;
}

/** Tarjeta de partido con su resumen de cupos en vivo. */
function MatchRowCard({ row, index }: { row: MatchRow; index: number }) {
  const summary = useAttendanceSummary(row.match.id);
  const confirmedCount = summary.data
    ? summary.data.confirmed.length
    : row.confirmedCount;
  const spotsLeft = summary.data
    ? Number(summary.data.spotsLeft)
    : row.spotsLeft;

  return (
    <MatchCard
      match={row.match}
      confirmedCount={confirmedCount}
      spotsLeft={spotsLeft}
      isFull={spotsLeft <= 0}
      index={index}
    />
  );
}

/** Página principal: próximos partidos ordenados por fecha. */
export function MatchesPage() {
  const { isOrganizer } = useIdentity();
  const matches = useUpcomingMatches();
  const [formOpen, setFormOpen] = useState(false);

  const rows: MatchRow[] = (matches.data ?? []).map((match) => ({
    match,
    confirmedCount: 0,
    spotsLeft: Number(match.maxPlayers),
    isFull: false,
  }));

  return (
    <div className="flex flex-col">
      <section className="border-b border-border bg-gradient-subtle">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-label">Fulbito del Barrio</p>
              <h1 className="mt-2 text-hero">Próximos partidos</h1>
              <p className="mt-3 text-body-lg text-muted-foreground">
                Revisa cuándo se juega, dónde es y cuántos cupos quedan. Entra a
                un partido para confirmar tu asistencia.
              </p>
            </div>

            {isOrganizer ? (
              <Button
                onClick={() => setFormOpen(true)}
                className="gap-2 self-start md:self-auto"
                data-ocid="matches.open_modal_button"
              >
                <CalendarPlus className="size-5" aria-hidden="true" />
                Programar partido
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        {matches.isLoading ? (
          <div
            className="flex flex-col gap-4"
            data-ocid="matches.loading_state"
            aria-busy="true"
          >
            {SKELETON_IDS.map((id) => (
              <Skeleton key={id} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : matches.isError ? (
          <div
            className="flex flex-col items-center gap-4 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-12 text-center"
            data-ocid="matches.error_state"
          >
            <h2 className="font-display text-2xl font-bold text-destructive">
              No pudimos cargar los partidos
            </h2>
            <p className="max-w-md text-lg text-muted-foreground">
              Revisa tu conexión e inténtalo de nuevo.
            </p>
            <Button
              variant="outline"
              onClick={() => void matches.refetch()}
              className="gap-2"
              data-ocid="matches.retry_button"
            >
              <RefreshCw className="size-5" aria-hidden="true" />
              Reintentar
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div
            className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-subtle"
            data-ocid="matches.empty_state"
          >
            <span
              className="flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
              aria-hidden="true"
            >
              <CalendarX2 className="size-8" />
            </span>
            <h2 className="font-display text-2xl font-bold">
              No hay partidos programados
            </h2>
            <p className="max-w-md text-lg text-muted-foreground">
              {isOrganizer
                ? "Programa el próximo encuentro para que el grupo pueda confirmar su asistencia."
                : "Cuando el organizador programe un partido, aparecerá aquí."}
            </p>
            {isOrganizer ? (
              <Button
                onClick={() => setFormOpen(true)}
                className="gap-2"
                data-ocid="matches.empty_primary_button"
              >
                <CalendarPlus className="size-5" aria-hidden="true" />
                Programar partido
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="flex flex-col gap-4" data-ocid="matches.list">
            {rows.map((row, index) => (
              <li key={row.match.id.toString()}>
                <MatchRowCard row={row} index={index} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {isOrganizer ? (
        <MatchFormDialog open={formOpen} onOpenChange={setFormOpen} />
      ) : null}
    </div>
  );
}
