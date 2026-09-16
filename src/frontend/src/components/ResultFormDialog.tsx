import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRecordResult } from "@/hooks/use-backend";
import { formatPlayerName, formatPosition } from "@/lib/format";
import type { ConfirmedPlayer, MatchResultView, PlayerView } from "@/types/app";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ResultFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: bigint;
  /** Plantel completo: cualquier jugador puede haber participado. */
  roster: PlayerView[];
  /** Jugadores confirmados, preseleccionados y marcados como tales. */
  confirmed: ConfirmedPlayer[];
  /** Resultado ya registrado, para precargar el formulario. */
  result?: MatchResultView | null;
}

type TeamSide = "teamA" | "teamB";

/**
 * Diálogo del organizador para registrar el resultado final y los equipos
 * de un partido ya jugado. Los participantes se eligen desde todo el plantel
 * y cada uno se asigna al Equipo A o al Equipo B.
 */
export function ResultFormDialog({
  open,
  onOpenChange,
  matchId,
  roster,
  confirmed,
  result,
}: ResultFormDialogProps) {
  const recordResult = useRecordResult();
  const [goalsTeamA, setGoalsTeamA] = useState("0");
  const [goalsTeamB, setGoalsTeamB] = useState("0");
  const [assignments, setAssignments] = useState<Record<string, TeamSide>>({});
  const [error, setError] = useState<string | null>(null);

  const confirmedIds = new Set(confirmed.map((p) => p.playerId.toString()));

  // Precarga el borrador una sola vez al abrir, nunca desde un refetch.
  useEffect(() => {
    if (!open) return;
    setGoalsTeamA(result ? result.goalsTeamA.toString() : "0");
    setGoalsTeamB(result ? result.goalsTeamB.toString() : "0");

    const next: Record<string, TeamSide> = {};
    if (result) {
      for (const id of result.teamA) next[id.toString()] = "teamA";
      for (const id of result.teamB) next[id.toString()] = "teamB";
    }
    setAssignments(next);
    setError(null);
  }, [open, result]);

  function assign(playerId: bigint, side: TeamSide) {
    setAssignments((current) => ({
      ...current,
      [playerId.toString()]: side,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const teamA: bigint[] = [];
    const teamB: bigint[] = [];

    for (const player of roster) {
      const side = assignments[player.id.toString()];
      if (side === "teamA") teamA.push(player.id);
      if (side === "teamB") teamB.push(player.id);
    }

    const goalsA = Number(goalsTeamA);
    const goalsB = Number(goalsTeamB);
    if (
      goalsTeamA.trim() === "" ||
      goalsTeamB.trim() === "" ||
      !Number.isFinite(goalsA) ||
      !Number.isFinite(goalsB) ||
      goalsA < 0 ||
      goalsB < 0
    ) {
      setError("Los goles deben ser números de cero o más.");
      return;
    }

    setError(null);
    recordResult.mutate(
      {
        matchId,
        input: {
          teamA,
          teamB,
          goalsTeamA: BigInt(Math.trunc(goalsA)),
          goalsTeamB: BigInt(Math.trunc(goalsB)),
        },
      },
      {
        onSuccess: () => {
          toast.success("Resultado registrado");
          onOpenChange(false);
        },
        onError: () =>
          setError("No se pudo guardar el resultado. Intenta otra vez."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        data-ocid="result_form.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Registrar resultado</DialogTitle>
          <DialogDescription className="text-base">
            Anota los goles de cada lado y elige quiénes jugaron. Puedes tomar a
            cualquier jugador del plantel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="goals-team-a" className="text-base font-semibold">
                Goles del Equipo A
              </Label>
              <Input
                id="goals-team-a"
                type="number"
                min={0}
                inputMode="numeric"
                value={goalsTeamA}
                onChange={(event) => setGoalsTeamA(event.target.value)}
                required
                data-ocid="result_form.team_a_goals_input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goals-team-b" className="text-base font-semibold">
                Goles del Equipo B
              </Label>
              <Input
                id="goals-team-b"
                type="number"
                min={0}
                inputMode="numeric"
                value={goalsTeamB}
                onChange={(event) => setGoalsTeamB(event.target.value)}
                required
                data-ocid="result_form.team_b_goals_input"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-display text-xl font-bold">
              Participantes ({roster.length} en el plantel)
            </h3>
            <p className="text-base text-muted-foreground">
              Toca Equipo A o Equipo B para cada jugador que jugó. Los
              confirmados ya vienen marcados.
            </p>

            {roster.length === 0 ? (
              <p
                className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-lg text-muted-foreground"
                data-ocid="result_form.empty_state"
              >
                El plantel todavía está vacío. Agrega jugadores para registrar
                el resultado.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {roster.map((player, index) => {
                  const side = assignments[player.id.toString()];
                  const isConfirmed = confirmedIds.has(player.id.toString());
                  return (
                    <li
                      key={player.id.toString()}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                      data-ocid={`result_form.player_item.${index + 1}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold">
                          {formatPlayerName(player)}
                        </p>
                        <p className="text-base text-muted-foreground">
                          {formatPosition(player.position)}
                        </p>
                        {isConfirmed ? (
                          <p
                            className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-sm font-semibold text-success"
                            data-ocid={`result_form.confirmed_badge.${index + 1}`}
                          >
                            <CheckCircle2
                              className="size-4"
                              aria-hidden="true"
                            />
                            Confirmado
                          </p>
                        ) : null}
                      </div>
                      <fieldset
                        className="flex gap-2 border-0 p-0"
                        aria-label={`Equipo de ${player.name}`}
                      >
                        <Button
                          type="button"
                          size="sm"
                          variant={side === "teamA" ? "default" : "outline"}
                          aria-pressed={side === "teamA"}
                          onClick={() => assign(player.id, "teamA")}
                          data-ocid={`result_form.team_a_button.${index + 1}`}
                        >
                          Equipo A
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={side === "teamB" ? "default" : "outline"}
                          aria-pressed={side === "teamB"}
                          onClick={() => assign(player.id, "teamB")}
                          data-ocid={`result_form.team_b_button.${index + 1}`}
                        >
                          Equipo B
                        </Button>
                      </fieldset>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-base font-medium text-destructive"
              data-ocid="result_form.error_state"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="result_form.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={recordResult.isPending}
              data-ocid="result_form.submit_button"
            >
              {recordResult.isPending ? "Guardando…" : "Guardar resultado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
