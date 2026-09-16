import { PlayerCard } from "@/components/PlayerCard";
import { PlayerFormDialog } from "@/components/PlayerFormDialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeletePlayer,
  usePlayers,
  useSearchPlayers,
} from "@/hooks/use-backend";
import { useIdentity } from "@/hooks/use-identity";
import { formatPlayerName } from "@/lib/format";
import type { PlayerView } from "@/types/app";
import { useNavigate } from "@tanstack/react-router";
import { Search, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SKELETON_IDS = Array.from({ length: 6 }, (_, i) => `player-${i}`);

/** Plantel completo del grupo, con búsqueda y gestión para el organizador. */
export function RosterPage() {
  const navigate = useNavigate();
  const { isOrganizer } = useIdentity();
  const [term, setTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlayerView | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PlayerView | null>(null);

  const trimmed = term.trim();
  const isSearching = trimmed.length > 0;
  const allPlayers = usePlayers();
  const searchResults = useSearchPlayers(term);
  const deletePlayer = useDeletePlayer();

  const activeQuery = isSearching ? searchResults : allPlayers;
  const players: PlayerView[] = activeQuery.data ?? [];
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (player: PlayerView) => {
    setEditing(player);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    deletePlayer.mutate(target.id, {
      onSuccess: () => {
        toast.success(`${formatPlayerName(target)} salió del plantel`);
        setPendingDelete(null);
      },
      onError: () => {
        toast.error("No se pudo dar de baja. Inténtalo otra vez.");
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-label">Grupo de fulbito</p>
          <h1 className="mt-2 text-hero">Plantel</h1>
          <p className="mt-3 text-body-lg text-muted-foreground">
            Todas las personas que juegan con nosotros, con su posición habitual
            y un teléfono para avisarles.
          </p>
        </div>
        {isOrganizer ? (
          <Button
            type="button"
            onClick={openCreate}
            className="gap-2 self-start lg:self-auto"
            data-ocid="roster.add_button"
          >
            <UserPlus className="size-5" aria-hidden="true" />
            Agregar integrante
          </Button>
        ) : null}
      </header>

      <section className="mt-8" aria-label="Buscar en el plantel">
        <label
          htmlFor="roster-search"
          className="text-base font-semibold text-foreground"
        >
          Buscar por nombre o apodo
        </label>
        <div className="relative mt-2 max-w-xl">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="roster-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Escribe un nombre o apodo…"
            className="h-12 pl-12 text-base"
            data-ocid="roster.search_input"
          />
        </div>
        {isSearching ? (
          <p
            className="mt-3 text-base text-muted-foreground"
            data-ocid="roster.search_summary"
          >
            {isLoading
              ? "Buscando…"
              : `${players.length} ${players.length === 1 ? "resultado" : "resultados"} para «${trimmed}»`}
          </p>
        ) : null}
      </section>

      <section className="mt-8" aria-label="Integrantes del plantel">
        {isLoading ? (
          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            data-ocid="roster.loading_state"
          >
            {SKELETON_IDS.map((id) => (
              <Skeleton key={id} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center"
            data-ocid="roster.error_state"
          >
            <p className="text-lg font-semibold text-destructive">
              No se pudo cargar el plantel
            </p>
            <p className="mt-2 text-base text-muted-foreground">
              Revisa tu conexión e inténtalo de nuevo.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void activeQuery.refetch()}
              data-ocid="roster.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : players.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-border bg-muted/40 p-10 text-center"
            data-ocid="roster.empty_state"
          >
            <span
              className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
              aria-hidden="true"
            >
              <Users className="size-8" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold">
              {isSearching
                ? "No encontramos a nadie con ese nombre"
                : "El plantel está vacío"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-base text-muted-foreground">
              {isSearching
                ? "Prueba con otro nombre o apodo, o revisa la lista completa."
                : "Agrega a la primera persona para empezar a organizar los partidos."}
            </p>
            {isSearching ? (
              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={() => setTerm("")}
                data-ocid="roster.clear_search_button"
              >
                Ver todo el plantel
              </Button>
            ) : isOrganizer ? (
              <Button
                type="button"
                className="mt-5 gap-2"
                onClick={openCreate}
                data-ocid="roster.empty_add_button"
              >
                <UserPlus className="size-5" aria-hidden="true" />
                Agregar integrante
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player, index) => (
              <PlayerCard
                key={player.id.toString()}
                player={player}
                index={index}
                canManage={isOrganizer}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </section>

      <PlayerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        player={editing}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent data-ocid="roster.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">
              ¿Dar de baja a{" "}
              {pendingDelete ? formatPlayerName(pendingDelete) : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Esta persona dejará de aparecer en el plantel y en las listas de
              asistencia. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-3">
            <AlertDialogCancel data-ocid="roster.delete_cancel_button">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePlayer.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="roster.delete_confirm_button"
            >
              {deletePlayer.isPending ? "Dando de baja…" : "Sí, dar de baja"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mt-10">
        <Button
          type="button"
          variant="outline"
          onClick={() => void navigate({ to: "/" })}
          data-ocid="roster.back_button"
        >
          Volver a los partidos
        </Button>
      </div>
    </div>
  );
}
