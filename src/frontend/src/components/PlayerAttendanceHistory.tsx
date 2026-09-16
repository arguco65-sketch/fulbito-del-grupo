import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllMatches, usePlayerAttendance } from "@/hooks/use-backend";
import { formatMatchDate, formatMatchTime } from "@/lib/format";
import type { AttendanceView, MatchView } from "@/types/app";
import { CalendarCheck, CalendarX } from "lucide-react";

interface PlayerAttendanceHistoryProps {
  playerId: bigint;
}

const SKELETON_IDS = Array.from({ length: 3 }, (_, i) => `attendance-${i}`);

/** Historial de asistencia de un integrante a los partidos del grupo. */
export function PlayerAttendanceHistory({
  playerId,
}: PlayerAttendanceHistoryProps) {
  const { data, isLoading, isError, refetch } = usePlayerAttendance(playerId);
  const matches = useAllMatches();

  const matchesById = new Map<string, MatchView>(
    (matches.data ?? []).map((match) => [match.id.toString(), match]),
  );

  const records: AttendanceView[] = [...(data ?? [])].sort((a, b) =>
    b.matchId > a.matchId ? 1 : b.matchId < a.matchId ? -1 : 0,
  );

  return (
    <section
      className="rounded-xl border border-border bg-card p-6 shadow-subtle"
      data-ocid="player_detail.attendance_section"
    >
      <div className="flex items-center gap-3">
        <CalendarCheck className="size-6 text-primary" aria-hidden="true" />
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Historial de asistencia
        </h2>
      </div>
      <p className="mt-2 text-base text-muted-foreground">
        Respuestas registradas para los partidos del grupo.
      </p>

      {isLoading ? (
        <div
          className="mt-5 flex flex-col gap-3"
          data-ocid="attendance.loading_state"
        >
          {SKELETON_IDS.map((id) => (
            <Skeleton key={id} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div
          className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 p-5"
          data-ocid="attendance.error_state"
        >
          <p className="text-base font-semibold text-destructive">
            No se pudo cargar el historial de asistencia.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 inline-flex min-h-11 items-center rounded-md border border-destructive/50 px-4 text-base font-semibold text-destructive transition-smooth hover:bg-destructive/10"
            data-ocid="attendance.retry_button"
          >
            Reintentar
          </button>
        </div>
      ) : records.length === 0 ? (
        <div
          className="mt-5 rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center"
          data-ocid="attendance.empty_state"
        >
          <p className="text-base font-semibold">
            Todavía no hay respuestas registradas
          </p>
          <p className="mt-1 text-base text-muted-foreground">
            Cuando esta persona confirme o rechace un partido, aparecerá aquí.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3" data-ocid="attendance.list">
          {records.map((record, index) => {
            const confirmed = record.status === "confirmed";
            const match = matchesById.get(record.matchId.toString());
            return (
              <li
                key={record.matchId.toString()}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3"
                data-ocid={`attendance.item.${index + 1}`}
              >
                <div className="flex items-center gap-3">
                  {confirmed ? (
                    <CalendarCheck
                      className="size-5 text-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <CalendarX
                      className="size-5 text-destructive"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-base font-semibold">
                    {match
                      ? formatAttendanceMatchLabel(match.date, match.time)
                      : `Partido #${record.matchId.toString()}`}
                  </span>
                </div>
                <Badge
                  variant={confirmed ? "default" : "outline"}
                  className="px-3 py-1.5 text-sm"
                  data-ocid={`attendance.status_badge.${index + 1}`}
                >
                  {confirmed ? "Confirmó" : "No asistió"}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Fecha y hora legibles de un partido, reutilizadas en la ficha. */
export function formatAttendanceMatchLabel(date: string, time: string): string {
  return `${formatMatchDate(date)} · ${formatMatchTime(time)}`;
}
