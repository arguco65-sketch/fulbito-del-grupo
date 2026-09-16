import { Button } from "@/components/ui/button";
import { formatPlayerName, formatScore } from "@/lib/format";
import type { MatchResultView, PlayerView } from "@/types/app";
import { Pencil, Trophy } from "lucide-react";

interface ResultPanelProps {
  result: MatchResultView;
  players: PlayerView[];
  /** El organizador puede corregir un resultado ya registrado. */
  canEdit: boolean;
  onEdit: () => void;
}

/** Marcador final de un partido con los equipos que lo jugaron. */
export function ResultPanel({
  result,
  players,
  canEdit,
  onEdit,
}: ResultPanelProps) {
  function renderTeam(ids: bigint[]) {
    return (
      <ul className="mt-2 flex flex-col gap-1">
        {ids.map((id) => {
          const player = players.find((item) => item.id === id);
          return (
            <li key={id.toString()} className="text-lg">
              {player ? formatPlayerName(player) : `Jugador ${id}`}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-elevated"
      data-ocid="match_detail.result_panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Trophy className="size-6 text-accent" aria-hidden="true" />
          Resultado final
        </h2>
        {canEdit ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="gap-2"
            data-ocid="match_detail.edit_result_button"
          >
            <Pencil className="size-4" aria-hidden="true" />
            Editar resultado
          </Button>
        ) : null}
      </div>

      <p className="font-display text-5xl font-bold tracking-tight">
        {formatScore(result.goalsTeamA, result.goalsTeamB)}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-label">Equipo A</p>
          {renderTeam(result.teamA)}
        </div>
        <div>
          <p className="text-label">Equipo B</p>
          {renderTeam(result.teamB)}
        </div>
      </div>
    </div>
  );
}
