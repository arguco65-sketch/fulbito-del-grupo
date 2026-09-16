import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSetAttendance } from "@/hooks/use-backend";
import { formatPlayerName, formatPosition } from "@/lib/format";
import type {
  AttendanceSummary,
  ConfirmedPlayer,
  PlayerView,
} from "@/types/app";
import { Check, Clock3, UserRound, X } from "lucide-react";
import { toast } from "sonner";

interface AttendancePanelProps {
  matchId: bigint;
  summary: AttendanceSummary;
  /** Jugador que representa al usuario actual, si su sesión está vinculada. */
  currentPlayer: PlayerView | null;
  /** El organizador puede marcar la asistencia de cualquier jugador. */
  canManageAll: boolean;
  /**
   * Plantel completo, usado para derivar quiénes aún no respondieron.
   * Si no se entrega, los pendientes provienen solo del resumen del backend.
   */
  roster?: PlayerView[];
}

/**
 * El backend puede exponer `pending` dentro del resumen. Mientras los bindings
 * no lo incluyan, se lee de forma defensiva para no romper la compilación.
 */
function readPending(summary: AttendanceSummary): ConfirmedPlayer[] | null {
  const value = (summary as AttendanceSummary & { pending?: ConfirmedPlayer[] })
    .pending;
  return Array.isArray(value) ? value : null;
}

/** Convierte un integrante del plantel al formato de fila de asistencia. */
function toConfirmedPlayer(player: PlayerView): ConfirmedPlayer {
  return {
    playerId: player.id,
    name: player.name,
    nickname: player.nickname,
    position: player.position,
  };
}

/**
 * Panel de asistencia de un partido: pendientes, confirmados y rechazados.
 * El jugador actual responde por sí mismo; el organizador puede responder
 * por cualquiera. Los pendientes se derivan del plantel menos quienes ya
 * respondieron, para que nadie quede sin poder confirmar.
 */
export function AttendancePanel({
  matchId,
  summary,
  currentPlayer,
  canManageAll,
  roster = [],
}: AttendancePanelProps) {
  const setAttendance = useSetAttendance();

  function answer(playerId: bigint, confirmed: boolean, name: string) {
    setAttendance.mutate(
      { matchId, playerId, confirmed },
      {
        onSuccess: () =>
          toast.success(
            confirmed
              ? `${name} quedó confirmado`
              : `${name} quedó como no asistente`,
          ),
        onError: () =>
          toast.error("No se pudo guardar la asistencia. Intenta otra vez."),
      },
    );
  }

  const pendingId = setAttendance.isPending
    ? setAttendance.variables?.playerId
    : undefined;

  const answeredIds = new Set<string>([
    ...summary.confirmed.map((player) => player.playerId.toString()),
    ...summary.declined.map((player) => player.playerId.toString()),
  ]);

  const pendingFromBackend = readPending(summary);
  const pending: ConfirmedPlayer[] =
    pendingFromBackend ??
    roster
      .filter((player) => !answeredIds.has(player.id.toString()))
      .map(toConfirmedPlayer);

  const isSelfPending =
    currentPlayer !== null &&
    pending.some((player) => player.playerId === currentPlayer.id);

  return (
    <div className="flex flex-col gap-8" data-ocid="attendance.panel">
      {isSelfPending && currentPlayer ? (
        <section
          className="flex flex-col gap-4 rounded-xl border-2 border-primary/40 bg-primary/5 p-6"
          data-ocid="attendance.self_section"
        >
          <div className="flex items-start gap-3">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
              aria-hidden="true"
            >
              <UserRound className="size-6" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-bold">
                ¿Vas a jugar este partido?
              </h2>
              <p className="text-lg text-muted-foreground">
                Responde por ti, {currentPlayer.name}. Tu respuesta se guarda al
                instante.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              disabled={pendingId === currentPlayer.id}
              onClick={() =>
                answer(currentPlayer.id, true, formatPlayerName(currentPlayer))
              }
              className="min-h-14 flex-1 gap-2 text-lg"
              data-ocid="attendance.self_confirm_button"
            >
              <Check className="size-6" aria-hidden="true" />
              Confirmar mi asistencia
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={pendingId === currentPlayer.id}
              onClick={() =>
                answer(currentPlayer.id, false, formatPlayerName(currentPlayer))
              }
              className="min-h-14 flex-1 gap-2 text-lg"
              data-ocid="attendance.self_decline_button"
            >
              <X className="size-6" aria-hidden="true" />
              No puedo asistir
            </Button>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">
            Falta responder ({pending.length})
          </h2>
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-1.5 text-sm"
            data-ocid="attendance.pending_badge"
          >
            <Clock3 className="size-4" aria-hidden="true" />
            Pendientes
          </Badge>
        </div>

        {pending.length === 0 ? (
          <p
            className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-lg text-muted-foreground"
            data-ocid="attendance.pending_empty_state"
          >
            Todos los integrantes del plantel ya respondieron.
          </p>
        ) : (
          <ul
            className="flex flex-col gap-2"
            data-ocid="attendance.pending_list"
          >
            {pending.map((player, index) => {
              const isSelf = currentPlayer?.id === player.playerId;
              return (
                <li
                  key={player.playerId.toString()}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-3"
                  data-ocid={`attendance.pending_item.${index + 1}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      aria-hidden="true"
                    >
                      <Clock3 className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold">
                        {formatPlayerName(player)}
                        {isSelf ? (
                          <span className="ml-2 text-base font-normal text-muted-foreground">
                            (tú)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-base text-muted-foreground">
                        {formatPosition(player.position)}
                      </p>
                    </div>
                  </div>

                  {canManageAll || isSelf ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={pendingId === player.playerId}
                        onClick={() =>
                          answer(
                            player.playerId,
                            true,
                            formatPlayerName(player),
                          )
                        }
                        className="gap-2"
                        data-ocid={`attendance.pending_confirm_button.${index + 1}`}
                      >
                        <Check className="size-4" aria-hidden="true" />
                        Confirmar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pendingId === player.playerId}
                        onClick={() =>
                          answer(
                            player.playerId,
                            false,
                            formatPlayerName(player),
                          )
                        }
                        className="gap-2"
                        data-ocid={`attendance.pending_decline_button.${index + 1}`}
                      >
                        <X className="size-4" aria-hidden="true" />
                        Rechazar
                      </Button>
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1.5 px-3 py-1.5 text-sm"
                    >
                      Sin responder
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">
            Confirmados ({summary.confirmed.length})
          </h2>
          <Badge
            variant={summary.spotsLeft > 0n ? "default" : "secondary"}
            className={
              summary.spotsLeft > 0n
                ? "gap-1.5 bg-accent px-3 py-1.5 text-sm text-accent-foreground"
                : "gap-1.5 px-3 py-1.5 text-sm"
            }
            data-ocid="attendance.spots_badge"
          >
            {summary.spotsLeft > 0n
              ? `Quedan ${summary.spotsLeft.toString()} cupos`
              : "Sin cupos"}
          </Badge>
        </div>

        {summary.confirmed.length === 0 ? (
          <p
            className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-lg text-muted-foreground"
            data-ocid="attendance.confirmed_empty_state"
          >
            Todavía nadie confirmó su asistencia.
          </p>
        ) : (
          <ul
            className="flex flex-col gap-2"
            data-ocid="attendance.confirmed_list"
          >
            {summary.confirmed.map((player, index) => {
              const isSelf = currentPlayer?.id === player.playerId;
              return (
                <li
                  key={player.playerId.toString()}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle"
                  data-ocid={`attendance.confirmed_item.${index + 1}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                      aria-hidden="true"
                    >
                      <UserRound className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold">
                        {formatPlayerName(player)}
                        {isSelf ? (
                          <span className="ml-2 text-base font-normal text-muted-foreground">
                            (tú)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-base text-muted-foreground">
                        {formatPosition(player.position)}
                      </p>
                    </div>
                  </div>

                  {canManageAll || isSelf ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pendingId === player.playerId}
                      onClick={() =>
                        answer(player.playerId, false, formatPlayerName(player))
                      }
                      className="gap-2"
                      data-ocid={`attendance.decline_button.${index + 1}`}
                    >
                      <X className="size-4" aria-hidden="true" />
                      Rechazar
                    </Button>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 px-3 py-1.5 text-sm"
                    >
                      <Check className="size-4" aria-hidden="true" />
                      Confirmado
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">
          No asisten ({summary.declined.length})
        </h2>

        {summary.declined.length === 0 ? (
          <p
            className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-lg text-muted-foreground"
            data-ocid="attendance.declined_empty_state"
          >
            Nadie rechazó su asistencia.
          </p>
        ) : (
          <ul
            className="flex flex-col gap-2"
            data-ocid="attendance.declined_list"
          >
            {summary.declined.map((player, index) => {
              const isSelf = currentPlayer?.id === player.playerId;
              return (
                <li
                  key={player.playerId.toString()}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3"
                  data-ocid={`attendance.declined_item.${index + 1}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      aria-hidden="true"
                    >
                      <Clock3 className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold">
                        {formatPlayerName(player)}
                        {isSelf ? (
                          <span className="ml-2 text-base font-normal text-muted-foreground">
                            (tú)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-base text-muted-foreground">
                        {formatPosition(player.position)}
                      </p>
                    </div>
                  </div>

                  {canManageAll || isSelf ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pendingId === player.playerId}
                      onClick={() =>
                        answer(player.playerId, true, formatPlayerName(player))
                      }
                      className="gap-2"
                      data-ocid={`attendance.confirm_button.${index + 1}`}
                    >
                      <Check className="size-4" aria-hidden="true" />
                      Confirmar
                    </Button>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1.5 px-3 py-1.5 text-sm"
                    >
                      <X className="size-4" aria-hidden="true" />
                      No asiste
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
