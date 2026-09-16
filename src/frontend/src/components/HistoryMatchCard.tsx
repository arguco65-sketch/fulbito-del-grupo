import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatCapacity,
  formatDayBadge,
  formatMatchDate,
  formatMatchTime,
  formatMonthBadge,
  formatPlayerName,
  formatPosition,
  formatScore,
  formatWeekdayBadge,
} from "@/lib/format";
import type { MatchHistoryEntry, PlayerView } from "@/types/app";
import { CalendarX2, MapPin, Trophy, Users } from "lucide-react";

interface HistoryMatchCardProps {
  entry: MatchHistoryEntry;
  /** Índice del partido dentro de la lista, para marcadores de prueba. */
  index: number;
  /** Plantel completo, usado para resolver los ids de quienes jugaron. */
  players: PlayerView[];
}

/** Bloque de calendario con día, mes y día de la semana. */
function DateBlock({ date }: { date: string }) {
  return (
    <div
      className="flex w-20 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-secondary px-2 py-3 text-secondary-foreground"
      aria-hidden="true"
    >
      <span className="text-sm font-semibold tracking-widest">
        {formatWeekdayBadge(date)}
      </span>
      <span className="font-display text-3xl font-bold leading-none">
        {formatDayBadge(date)}
      </span>
      <span className="text-sm font-semibold tracking-widest">
        {formatMonthBadge(date)}
      </span>
    </div>
  );
}

/** Tarjeta de un partido ya jugado: resultado y quiénes asistieron. */
export function HistoryMatchCard({
  entry,
  index,
  players,
}: HistoryMatchCardProps) {
  const { match, result, players: playerIds } = entry;
  const position = index + 1;

  const byId = new Map(players.map((player) => [player.id.toString(), player]));
  const attendees = playerIds
    .map((id) => byId.get(id.toString()))
    .filter((player): player is PlayerView => player !== undefined);

  const teamA = new Set((result?.teamA ?? []).map((id) => id.toString()));
  const teamB = new Set((result?.teamB ?? []).map((id) => id.toString()));

  return (
    <Card
      className="overflow-hidden border-border shadow-subtle transition-smooth hover:shadow-elevated"
      data-ocid={`history.item.${position}`}
    >
      <CardHeader className="gap-4 pb-4">
        <div className="flex flex-wrap items-start gap-4">
          <DateBlock date={match.date} />

          <div className="min-w-0 flex-1">
            <h3 className="font-display text-2xl font-bold leading-tight">
              {formatMatchDate(match.date)}
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {match.place}
              </span>
              <span>{formatMatchTime(match.time)}</span>
            </p>
          </div>

          {match.cancelled ? (
            <Badge
              variant="outline"
              className="gap-1.5 border-destructive/40 px-3 py-1.5 text-sm font-semibold text-destructive"
              data-ocid={`history.cancelled_badge.${position}`}
            >
              <CalendarX2 className="size-4" aria-hidden="true" />
              Partido cancelado
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {result ? (
          <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-gradient-subtle px-4 py-4"
            data-ocid={`history.result.${position}`}
          >
            <span className="inline-flex items-center gap-2 text-label">
              <Trophy className="size-5 text-accent" aria-hidden="true" />
              Resultado final
            </span>
            <span className="font-display text-4xl font-bold tabular-nums tracking-tight">
              {formatScore(result.goalsTeamA, result.goalsTeamB)}
            </span>
          </div>
        ) : (
          <p
            className="rounded-xl border border-dashed border-border bg-muted px-4 py-4 text-base font-semibold text-muted-foreground"
            data-ocid={`history.no_result.${position}`}
          >
            Sin resultado registrado
          </p>
        )}

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="inline-flex items-center gap-2 text-label">
              <Users className="size-5" aria-hidden="true" />
              Jugadores
            </h4>
            <span className="text-base font-semibold text-muted-foreground">
              {formatCapacity(attendees.length, Number(match.maxPlayers))}
            </span>
          </div>

          {attendees.length > 0 ? (
            <ul
              className="mt-3 flex flex-wrap gap-2"
              data-ocid={`history.players.${position}`}
            >
              {attendees.map((player) => {
                const key = player.id.toString();
                const inTeamA = teamA.has(key);
                const inTeamB = teamB.has(key);
                const teamLabel = inTeamA
                  ? "Equipo A"
                  : inTeamB
                    ? "Equipo B"
                    : null;

                return (
                  <li
                    key={key}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5"
                  >
                    <span className="text-base font-semibold">
                      {formatPlayerName(player)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatPosition(player.position)}
                    </span>
                    {teamLabel ? (
                      <Badge
                        variant="secondary"
                        className="px-2 py-0.5 text-sm font-semibold"
                      >
                        {teamLabel}
                      </Badge>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p
              className="mt-3 rounded-xl border border-dashed border-border bg-muted px-4 py-3 text-base text-muted-foreground"
              data-ocid={`history.players_empty.${position}`}
            >
              No hay jugadores registrados para este partido.
            </p>
          )}
        </div>

        {result ? (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground">
              Equipos definidos al registrar el resultado.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
