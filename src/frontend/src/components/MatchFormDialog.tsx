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
import { useCreateMatch, useUpdateMatch } from "@/hooks/use-backend";
import type { MatchView } from "@/types/app";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Partido a editar; si falta, el diálogo crea uno nuevo. */
  match?: MatchView | null;
}

interface MatchDraft {
  date: string;
  time: string;
  place: string;
  maxPlayers: string;
}

const EMPTY_DRAFT: MatchDraft = {
  date: "",
  time: "",
  place: "",
  maxPlayers: "12",
};

/**
 * Diálogo para crear o editar un partido. Solo el organizador lo abre.
 * Los campos se guardan como borrador local hasta que se envía el formulario.
 */
export function MatchFormDialog({
  open,
  onOpenChange,
  match,
}: MatchFormDialogProps) {
  const isEditing = !!match;
  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();
  const [draft, setDraft] = useState<MatchDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  // Inicializa el borrador una sola vez al abrir, nunca desde un refetch.
  useEffect(() => {
    if (!open) return;
    if (match) {
      setDraft({
        date: match.date,
        time: match.time,
        place: match.place,
        maxPlayers: match.maxPlayers.toString(),
      });
    } else {
      setDraft(EMPTY_DRAFT);
    }
    setError(null);
  }, [open, match]);

  const isPending = createMatch.isPending || updateMatch.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const maxPlayers = Number(draft.maxPlayers);
    if (!draft.date || !draft.time || !draft.place.trim()) {
      setError("Completa la fecha, la hora y el lugar del partido.");
      return;
    }
    if (!Number.isFinite(maxPlayers) || maxPlayers < 2) {
      setError("El cupo máximo debe ser un número de al menos 2 jugadores.");
      return;
    }
    setError(null);

    const input = {
      date: draft.date,
      time: draft.time,
      place: draft.place.trim(),
      maxPlayers: BigInt(Math.trunc(maxPlayers)),
    };

    if (match) {
      updateMatch.mutate(
        { id: match.id, input },
        {
          onSuccess: () => {
            toast.success("Partido actualizado");
            onOpenChange(false);
          },
          onError: () =>
            setError("No se pudo guardar el partido. Intenta otra vez."),
        },
      );
      return;
    }

    createMatch.mutate(input, {
      onSuccess: () => {
        toast.success("Partido programado");
        onOpenChange(false);
      },
      onError: () =>
        setError("No se pudo guardar el partido. Intenta otra vez."),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        data-ocid="match_form.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEditing ? "Editar partido" : "Programar partido"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isEditing
              ? "Actualiza los datos del encuentro. Los cambios se ven al instante."
              : "Indica cuándo y dónde se juega y cuántos jugadores entran."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="match-date" className="text-base font-semibold">
                Fecha
              </Label>
              <Input
                id="match-date"
                type="date"
                value={draft.date}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                required
                data-ocid="match_form.date_input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="match-time" className="text-base font-semibold">
                Hora
              </Label>
              <Input
                id="match-time"
                type="time"
                value={draft.time}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    time: event.target.value,
                  }))
                }
                required
                data-ocid="match_form.time_input"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="match-place" className="text-base font-semibold">
              Lugar
            </Label>
            <Input
              id="match-place"
              type="text"
              value={draft.place}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  place: event.target.value,
                }))
              }
              placeholder="Cancha 2, Complejo Los Álamos"
              required
              data-ocid="match_form.place_input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="match-capacity" className="text-base font-semibold">
              Cupo máximo de jugadores
            </Label>
            <Input
              id="match-capacity"
              type="number"
              min={2}
              max={40}
              inputMode="numeric"
              value={draft.maxPlayers}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  maxPlayers: event.target.value,
                }))
              }
              required
              data-ocid="match_form.capacity_input"
            />
            <p className="text-base text-muted-foreground">
              Cuántos jugadores pueden confirmar su asistencia.
            </p>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-base font-medium text-destructive"
              data-ocid="match_form.error_state"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="match_form.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="match_form.submit_button"
            >
              {isPending
                ? "Guardando…"
                : isEditing
                  ? "Guardar cambios"
                  : "Programar partido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
