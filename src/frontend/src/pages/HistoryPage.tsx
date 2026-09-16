import { HistoryMatchCard } from "@/components/HistoryMatchCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatchHistory, usePlayers } from "@/hooks/use-backend";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarDays, History } from "lucide-react";

const SKELETON_IDS = Array.from(
  { length: 3 },
  (_, index) => `history-skeleton-${index}`,
);

/** Historial de partidos jugados con su resultado y quienes asistieron. */
export function HistoryPage() {
  const historyQuery = useMatchHistory();
  const playersQuery = usePlayers();

  const entries = historyQuery.data ?? [];
  const players = playersQuery.data ?? [];
  const isLoading = historyQuery.isLoading || playersQuery.isLoading;
  const isError = historyQuery.isError || playersQuery.isError;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-3xl">
        <p className="text-label">Memoria del grupo</p>
        <h1 className="mt-2 text-hero">Historial de partidos</h1>
        <p className="mt-4 text-body-lg text-muted-foreground">
          Revisa los partidos que ya se jugaron, cómo quedó el marcador y
          quiénes estuvieron en la cancha.
        </p>
      </header>

      <section className="mt-10" aria-labelledby="historial-lista">
        <h2 id="historial-lista" className="sr-only">
          Lista de partidos jugados
        </h2>

        {isLoading ? (
          <div
            className="flex flex-col gap-6"
            data-ocid="history.loading_state"
            aria-busy="true"
          >
            {SKELETON_IDS.map((id) => (
              <Card key={id} className="border-border shadow-subtle">
                <CardContent className="flex flex-col gap-4 py-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-20 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-7 w-2/3" />
                      <Skeleton className="h-5 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-10 w-3/4 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card
            className="border-destructive/40 shadow-subtle"
            data-ocid="history.error_state"
          >
            <CardContent className="flex flex-col items-start gap-4 py-10">
              <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="size-7" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-2xl font-bold">
                  No pudimos cargar el historial
                </h3>
                <p className="mt-2 text-body-lg text-muted-foreground">
                  Revisa tu conexión e inténtalo otra vez.
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  void historyQuery.refetch();
                  void playersQuery.refetch();
                }}
                data-ocid="history.retry_button"
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : entries.length === 0 ? (
          <Card
            className="border-border shadow-subtle"
            data-ocid="history.empty_state"
          >
            <CardContent className="flex flex-col items-start gap-4 py-12">
              <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <History className="size-7" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-2xl font-bold">
                  Todavía no hay partidos jugados
                </h3>
                <p className="mt-2 text-body-lg text-muted-foreground">
                  Cuando se juegue el primer partido y se registre el resultado,
                  aparecerá aquí con la lista de quienes asistieron.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-gradient-primary text-primary-foreground"
              >
                <Link to="/" data-ocid="history.go_matches_link">
                  <CalendarDays className="size-5" aria-hidden="true" />
                  Ver próximos partidos
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-6" data-ocid="history.list">
            {entries.map((entry, index) => (
              <li key={entry.match.id.toString()}>
                <HistoryMatchCard
                  entry={entry}
                  index={index}
                  players={players}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
