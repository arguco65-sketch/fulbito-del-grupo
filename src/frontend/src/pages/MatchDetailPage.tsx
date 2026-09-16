import { AttendancePanel } from "@/components/AttendancePanel";
import { MatchFormDialog } from "@/components/MatchFormDialog";
import { ResultFormDialog } from "@/components/ResultFormDialog";
import { ResultPanel } from "@/components/ResultPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAttendanceSummary,
  useCancelMatch,
  useMatch,
  usePlayers,
  useResult,
} from "@/hooks/use-backend";
import { useCurrentPlayer, useIdentity } from "@/hooks/use-identity";
import {
  formatMatchDate,
  formatMatchTime,
  formatPlayerName,
} from "@/lib/format";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarX2,
  Clock,
  MapPin,
  Pencil,
  RefreshCw,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function parseMatchId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

/** Página de detalle de un partido: datos, asistencia y resultado. */
export function MatchDetailPage() {
  const params = useParams({ from: "/partidos/$matchId" });
  const matchId = parseMatchId(params.matchId);
  const { isOrganizer } = useIdentity();

  const match = useMatch(matchId);
  const summary = useAttendanceSummary(matchId);
  const result = useResult(matchId);
  const players = usePlayers();
  const cancelMatch = useCancelMatch();
  const { currentPlayer, selectPlayer } = useCurrentPlayer(players.data);

  const [editOpen, setEditOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (matchId === null) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <div
          className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-subtle"
          data-ocid="match_detail.not_found_state"
        >
          <h1 className="font-display text-2xl font-bold">
            Partido no encontrado
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            El enlace no corresponde a un partido válido.
          </p>
          <Button
            asChild
            className="gap-2"
            data-ocid="match_detail.back_button"
          >
            <Link to="/">
              <ArrowLeft className="size-5" aria-hidden="true" />
              Volver a los partidos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (match.isLoading) {
    return (
      <div
        className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6"
        data-ocid="match_detail.loading_state"
        aria-busy="true"
      >
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (match.isError || !match.data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <div
          className="flex flex-col items-center gap-4 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-16 text-center"
          data-ocid="match_detail.error_state"
        >
          <h1 className="font-display text-2xl font-bold text-destructive">
            No pudimos cargar el partido
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Puede que ya no exista o que la conexión haya fallado.
          </p>
          <Button
            variant="outline"
            onClick={() => void match.refetch()}
            className="gap-2"
            data-ocid="match_detail.retry_button"
          >
            <RefreshCw className="size-5" aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const currentMatch = match.data;
  const confirmed = summary.data?.confirmed ?? [];
  const spotsLeft = summary.data ? Number(summary.data.spotsLeft) : 0;
  const roster = players.data ?? [];

  function handleCancel() {
    if (!matchId) return;
    cancelMatch.mutate(matchId, {
      onSuccess: () => {
        toast.success("Partido cancelado");
        setCancelOpen(false);
      },
      onError: () =>
        toast.error("No se pudo cancelar el partido. Intenta otra vez."),
    });
  }

  return (
    <div className="flex flex-col">
      <section className="border-b border-border bg-gradient-subtle">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
          <Button
            asChild
            variant="ghost"
            className="w-fit gap-2 px-2"
            data-ocid="match_detail.back_button"
          >
            <Link to="/">
              <ArrowLeft className="size-5" aria-hidden="true" />
              Volver a los partidos
            </Link>
          </Button>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-label">Partido programado</p>
              {currentMatch.cancelled ? (
                <Badge
                  variant="destructive"
                  className="gap-1.5 px-3 py-1.5 text-sm"
                  data-ocid="match_detail.cancelled_badge"
                >
                  <CalendarX2 className="size-4" aria-hidden="true" />
                  Cancelado
                </Badge>
              ) : (
                <Badge
                  variant={spotsLeft > 0 ? "default" : "secondary"}
                  className={
                    spotsLeft > 0
                      ? "gap-1.5 bg-accent px-3 py-1.5 text-sm text-accent-foreground"
                      : "gap-1.5 px-3 py-1.5 text-sm"
                  }
                  data-ocid="match_detail.spots_badge"
                >
                  <Users className="size-4" aria-hidden="true" />
                  {spotsLeft > 0 ? `Quedan ${spotsLeft} cupos` : "Sin cupos"}
                </Badge>
              )}
            </div>

            <h1 className="text-hero">{formatMatchDate(currentMatch.date)}</h1>

            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle">
                <Clock
                  className="size-6 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-label">Hora</dt>
                  <dd className="text-lg font-semibold">
                    {formatMatchTime(currentMatch.time)}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle sm:col-span-2">
                <MapPin
                  className="size-6 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <dt className="text-label">Lugar</dt>
                  <dd className="break-words text-lg font-semibold">
                    {currentMatch.place}
                  </dd>
                </div>
              </div>
            </dl>

            {isOrganizer ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(true)}
                  className="gap-2"
                  data-ocid="match_detail.edit_button"
                >
                  <Pencil className="size-5" aria-hidden="true" />
                  Editar partido
                </Button>
                {!currentMatch.cancelled ? (
                  <Button
                    variant="outline"
                    onClick={() => setCancelOpen(true)}
                    className="gap-2 text-destructive hover:text-destructive"
                    data-ocid="match_detail.cancel_button"
                  >
                    <CalendarX2 className="size-5" aria-hidden="true" />
                    Cancelar partido
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 md:py-12">
        <div className="flex flex-col gap-10">
          {result.data ? (
            <ResultPanel
              result={result.data}
              players={players.data ?? []}
              canEdit={isOrganizer}
              onEdit={() => setResultOpen(true)}
            />
          ) : isOrganizer ? (
            <div
              className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border bg-card p-6 shadow-subtle"
              data-ocid="match_detail.result_empty_state"
            >
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
                <Trophy className="size-6 text-accent" aria-hidden="true" />
                Resultado del partido
              </h2>
              <p className="text-lg text-muted-foreground">
                Cuando termine el partido, registra los goles y los equipos.
              </p>
              <Button
                onClick={() => setResultOpen(true)}
                className="gap-2"
                data-ocid="match_detail.record_result_button"
              >
                <Trophy className="size-5" aria-hidden="true" />
                Registrar resultado
              </Button>
              <p className="text-base text-muted-foreground">
                Elige a los jugadores que jugaron desde todo el plantel y
                repártelos en dos equipos.
              </p>
            </div>
          ) : null}

          {!isOrganizer ? (
            <section
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-subtle"
              data-ocid="match_detail.identity_section"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                  aria-hidden="true"
                >
                  <UserRound className="size-6" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-bold">
                    ¿Quién eres?
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Elige tu nombre para confirmar o rechazar tu asistencia.
                  </p>
                </div>
              </div>

              {roster.length === 0 ? (
                <p
                  className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-lg text-muted-foreground"
                  data-ocid="match_detail.identity_empty_state"
                >
                  El plantel todavía está vacío. Pídele al organizador que te
                  agregue.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="current-player"
                    className="text-base font-semibold"
                  >
                    Tu nombre en el plantel
                  </label>
                  <select
                    id="current-player"
                    value={currentPlayer ? currentPlayer.id.toString() : ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      selectPlayer(value === "" ? null : BigInt(value));
                    }}
                    className="min-h-12 w-full rounded-md border border-input bg-background px-4 text-lg font-semibold text-foreground transition-smooth focus-visible:border-ring"
                    data-ocid="match_detail.identity_select"
                  >
                    <option value="">Selecciona tu nombre…</option>
                    {roster.map((player) => (
                      <option
                        key={player.id.toString()}
                        value={player.id.toString()}
                      >
                        {formatPlayerName(player)}
                      </option>
                    ))}
                  </select>
                  {currentPlayer ? (
                    <p
                      className="text-base text-muted-foreground"
                      data-ocid="match_detail.identity_success_state"
                    >
                      Listo, {currentPlayer.name}. Ya puedes responder por ti.
                    </p>
                  ) : (
                    <p
                      className="text-base text-muted-foreground"
                      data-ocid="match_detail.identity_hint_state"
                    >
                      Sin elegir, solo podrás ver la lista de asistencia.
                    </p>
                  )}
                </div>
              )}
            </section>
          ) : null}

          {summary.isLoading ? (
            <div
              className="flex flex-col gap-3"
              data-ocid="match_detail.attendance_loading_state"
              aria-busy="true"
            >
              <Skeleton className="h-8 w-56 rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : summary.isError || !summary.data ? (
            <div
              className="flex flex-col items-start gap-4 rounded-xl border border-destructive/40 bg-destructive/10 p-6"
              data-ocid="match_detail.attendance_error_state"
            >
              <h2 className="font-display text-2xl font-bold text-destructive">
                No pudimos cargar la asistencia
              </h2>
              <Button
                variant="outline"
                onClick={() => void summary.refetch()}
                className="gap-2"
                data-ocid="match_detail.attendance_retry_button"
              >
                <RefreshCw className="size-5" aria-hidden="true" />
                Reintentar
              </Button>
            </div>
          ) : (
            <AttendancePanel
              matchId={matchId}
              summary={summary.data}
              roster={roster}
              currentPlayer={currentPlayer}
              canManageAll={isOrganizer}
            />
          )}
        </div>
      </section>

      {isOrganizer ? (
        <>
          <MatchFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            match={currentMatch}
          />
          <ResultFormDialog
            open={resultOpen}
            onOpenChange={setResultOpen}
            matchId={matchId}
            roster={roster}
            confirmed={confirmed}
            result={result.data ?? null}
          />
          <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <AlertDialogContent data-ocid="match_detail.cancel_dialog">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl">
                  ¿Cancelar este partido?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  El partido quedará marcado como cancelado y ya no aparecerá
                  entre los próximos encuentros.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 sm:gap-3">
                <AlertDialogCancel data-ocid="match_detail.cancel_dialog_cancel_button">
                  Volver
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={cancelMatch.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-ocid="match_detail.confirm_button"
                >
                  {cancelMatch.isPending ? "Cancelando…" : "Sí, cancelar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  );
}
