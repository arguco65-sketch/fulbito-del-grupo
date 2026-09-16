import { PlayerAttendanceHistory } from "@/components/PlayerAttendanceHistory";
import { PlayerFormDialog } from "@/components/PlayerFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayer } from "@/hooks/use-backend";
import { useIdentity } from "@/hooks/use-identity";
import { formatPosition, phoneHref } from "@/lib/format";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Phone, UserRound } from "lucide-react";
import { useState } from "react";

/** Ficha de detalle de un integrante del plantel. */
export function PlayerDetailPage() {
  const { playerId } = useParams({ from: "/plantel/$playerId" });
  const navigate = useNavigate();
  const { isOrganizer } = useIdentity();
  const [formOpen, setFormOpen] = useState(false);

  const parsedId = /^\d+$/.test(playerId) ? BigInt(playerId) : null;
  const { data: player, isLoading, isError, refetch } = usePlayer(parsedId);

  if (isLoading) {
    return (
      <div
        className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14"
        data-ocid="player_detail.loading_state"
      >
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="mt-6 h-56 w-full rounded-xl" />
        <Skeleton className="mt-6 h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !player) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div
          className="rounded-xl border border-dashed border-border bg-muted/40 p-10 text-center"
          data-ocid="player_detail.empty_state"
        >
          <span
            className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
            aria-hidden="true"
          >
            <UserRound className="size-8" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold">
            No encontramos a este integrante
          </h1>
          <p className="mx-auto mt-2 max-w-md text-base text-muted-foreground">
            Puede que haya salido del plantel o que el enlace esté incompleto.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
              data-ocid="player_detail.retry_button"
            >
              Reintentar
            </Button>
            <Button asChild data-ocid="player_detail.back_button">
              <Link to="/plantel">Volver al plantel</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const position = formatPosition(player.position);
  const hasPhone = player.phone.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Button
        type="button"
        variant="ghost"
        className="gap-2"
        onClick={() => void navigate({ to: "/plantel" })}
        data-ocid="player_detail.back_button"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
        Volver al plantel
      </Button>

      <article
        className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-subtle"
        data-ocid="player_detail.card"
      >
        <div className="bg-gradient-primary px-6 py-8 text-primary-foreground sm:px-8">
          <div className="flex flex-wrap items-center gap-5">
            <span
              className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15"
              aria-hidden="true"
            >
              <UserRound className="size-10" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-widest uppercase opacity-90">
                Ficha del integrante
              </p>
              <h1 className="mt-1 font-display text-4xl font-bold tracking-tight break-words">
                {player.name}
              </h1>
              <p className="mt-1 text-lg opacity-95">
                {player.nickname ? `«${player.nickname}»` : "Sin apodo"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-7 sm:grid-cols-2 sm:px-8">
          <div>
            <p className="text-label">Posición habitual</p>
            <Badge
              variant="secondary"
              className="mt-2 px-3 py-1.5 text-base"
              data-ocid="player_detail.position_badge"
            >
              {position}
            </Badge>
          </div>

          <div>
            <p className="text-label">Teléfono de contacto</p>
            {hasPhone ? (
              <a
                href={phoneHref(player.phone)}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-lg font-semibold transition-smooth hover:bg-secondary hover:text-secondary-foreground"
                data-ocid="player_detail.phone_link"
              >
                <Phone className="size-5" aria-hidden="true" />
                {player.phone}
              </a>
            ) : (
              <p className="mt-2 text-lg text-muted-foreground">
                Sin teléfono registrado
              </p>
            )}
          </div>

          {isOrganizer ? (
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setFormOpen(true)}
                data-ocid="player_detail.edit_button"
              >
                <Pencil className="size-5" aria-hidden="true" />
                Editar datos
              </Button>
            </div>
          ) : null}
        </div>
      </article>

      <div className="mt-6">
        <PlayerAttendanceHistory playerId={player.id} />
      </div>

      <PlayerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        player={player}
      />
    </div>
  );
}
