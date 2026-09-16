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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePlayer, useUpdatePlayer } from "@/hooks/use-backend";
import type { PlayerInput, PlayerView } from "@/types/app";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const POSITION_OPTIONS = [
  { value: "portero", label: "Portero" },
  { value: "defensa", label: "Defensa" },
  { value: "mediocampista", label: "Mediocampista" },
  { value: "delantero", label: "Delantero" },
] as const;

interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Integrante a editar; null cuando se da de alta uno nuevo. */
  player: PlayerView | null;
}

/** Alta y edición de integrantes del plantel. */
export function PlayerFormDialog({
  open,
  onOpenChange,
  player,
}: PlayerFormDialogProps) {
  const isEditing = player !== null;
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const isPending = createPlayer.isPending || updatePlayer.isPending;

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [position, setPosition] = useState("mediocampista");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Inicializa el borrador una sola vez al abrir el diálogo.
  useEffect(() => {
    if (!open) return;
    setName(player?.name ?? "");
    setNickname(player?.nickname ?? "");
    setPosition(player?.position || "mediocampista");
    setPhone(player?.phone ?? "");
    setError(null);
  }, [open, player]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Escribe el nombre del integrante.");
      return;
    }
    setError(null);

    const input: PlayerInput = {
      name: trimmedName,
      nickname: nickname.trim(),
      position,
      phone: phone.trim(),
    };

    const onError = () => {
      setError("No se pudo guardar. Revisa tu conexión e inténtalo otra vez.");
    };

    if (isEditing && player) {
      updatePlayer.mutate(
        { id: player.id, input },
        {
          onSuccess: () => {
            toast.success("Integrante actualizado");
            onOpenChange(false);
          },
          onError,
        },
      );
      return;
    }

    createPlayer.mutate(input, {
      onSuccess: () => {
        toast.success("Integrante agregado al plantel");
        onOpenChange(false);
      },
      onError,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" data-ocid="player_form.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isEditing ? "Editar integrante" : "Agregar integrante"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isEditing
              ? "Actualiza los datos de contacto y la posición habitual."
              : "Completa los datos para sumar a una persona al plantel."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="player-name" className="text-base font-semibold">
              Nombre y apellido
            </Label>
            <Input
              id="player-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Juan Pérez"
              autoComplete="name"
              aria-invalid={error !== null}
              data-ocid="player_form.name_input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="player-nickname"
              className="text-base font-semibold"
            >
              Apodo
            </Label>
            <Input
              id="player-nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="El Chino"
              data-ocid="player_form.nickname_input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-base font-semibold">Posición habitual</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger
                className="h-12 w-full text-base"
                data-ocid="player_form.position_select"
              >
                <SelectValue placeholder="Elige una posición" />
              </SelectTrigger>
              <SelectContent>
                {POSITION_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-base"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="player-phone" className="text-base font-semibold">
              Teléfono de contacto
            </Label>
            <Input
              id="player-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+51 987 654 321"
              autoComplete="tel"
              data-ocid="player_form.phone_input"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-base font-semibold text-destructive"
              data-ocid="player_form.error_state"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="player_form.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="player_form.submit_button"
            >
              {isPending
                ? "Guardando…"
                : isEditing
                  ? "Guardar cambios"
                  : "Agregar al plantel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
