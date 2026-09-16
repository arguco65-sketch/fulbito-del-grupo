import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatCapacity,
  formatDayBadge,
  formatMatchDate,
  formatMatchTime,
  formatMonthBadge,
  formatSpotsLeft,
  formatWeekdayBadge,
} from "@/lib/format";
import type { MatchView } from "@/types/app";
import { Link } from "@tanstack/react-router";
import { CalendarX2, Clock, MapPin, Users } from "lucide-react";

interface MatchCardProps {
  match: MatchView;
  confirmedCount: number;
  spotsLeft: number;
  isFull: boolean;
  /** Posición del partido en la lista, para marcadores deterministas. */
  index: number;
}

/**
 * Tarjeta de un partido programado: bloque de calendario, datos del encuentro
 * y estado de cupos. Toda la tarjeta enlaza a la página de detalle.
 */
export function MatchCard({
  match,
  confirmedCount,
  spotsLeft,
  isFull,
  index,
}: MatchCardProps) {
  const capacityLabel = formatCapacity(
    confirmedCount,
    Number(match.maxPlayers),
  );

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-subtle transition-smooth hover:shadow-elevated"
      data-ocid={`matches.item.${index + 1}`}
    >
      <div className="flex items-stretch gap-4 p-5 sm:p-6">
        <div
          className="flex w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-primary px-2 py-3 text-primary-foreground"
          aria-hidden="true"
        >
          <span className="text-sm font-semibold tracking-widest">
            {formatWeekdayBadge(match.date)}
          </span>
          <span className="font-display text-3xl font-bold leading-none">
            {formatDayBadge(match.date)}
          </span>
          <span className="text-sm font-semibold tracking-widest">
            {formatMonthBadge(match.date)}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-bold leading-tight">
                <Link
                  to="/partidos/$matchId"
                  params={{ matchId: match.id.toString() }}
                  className="rounded transition-smooth hover:text-primary focus-visible:text-primary"
                  data-ocid={`matches.link.${index + 1}`}
                >
                  {formatMatchDate(match.date)}
                </Link>
              </h2>
              <p className="mt-1 flex items-center gap-2 text-lg text-muted-foreground">
                <Clock className="size-5 shrink-0" aria-hidden="true" />
                {formatMatchTime(match.time)}
              </p>
            </div>

            {match.cancelled ? (
              <Badge
                variant="destructive"
                className="gap-1.5 px-3 py-1.5 text-sm"
                data-ocid={`matches.cancelled_badge.${index + 1}`}
              >
                <CalendarX2 className="size-4" aria-hidden="true" />
                Cancelado
              </Badge>
            ) : (
              <Badge
                variant={isFull ? "secondary" : "default"}
                className={
                  isFull
                    ? "gap-1.5 px-3 py-1.5 text-sm"
                    : "gap-1.5 bg-accent px-3 py-1.5 text-sm text-accent-foreground"
                }
                data-ocid={`matches.spots_badge.${index + 1}`}
              >
                <Users className="size-4" aria-hidden="true" />
                {formatSpotsLeft(spotsLeft)}
              </Badge>
            )}
          </div>

          <p className="flex items-center gap-2 text-lg">
            <MapPin
              className="size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="min-w-0 break-words">{match.place}</span>
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-base text-muted-foreground">{capacityLabel}</p>
            <Button
              asChild
              variant="outline"
              className="gap-2"
              data-ocid={`matches.detail_button.${index + 1}`}
            >
              <Link
                to="/partidos/$matchId"
                params={{ matchId: match.id.toString() }}
              >
                Ver detalle
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
