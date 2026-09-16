import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPosition, phoneHref } from "@/lib/format";
import type { PlayerView } from "@/types/app";
import { Link } from "@tanstack/react-router";
import { Pencil, Phone, Trash2, UserRound } from "lucide-react";

interface PlayerCardProps {
  player: PlayerView;
  /** Posición dentro de la lista, usada para los marcadores de prueba. */
  index: number;
  /** Solo el organizador puede editar o dar de baja integrantes. */
  canManage: boolean;
  onEdit: (player: PlayerView) => void;
  onDelete: (player: PlayerView) => void;
}

/** Ficha resumida de un integrante del plantel. */
export function PlayerCard({
  player,
  index,
  canManage,
  onEdit,
  onDelete,
}: PlayerCardProps) {
  const position = formatPosition(player.position);
  const hasPhone = player.phone.trim().length > 0;

  return (
    <article
      className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-subtle transition-smooth hover:shadow-elevated"
      data-ocid={`roster.item.${index + 1}`}
    >
      <div className="flex items-start gap-4">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          aria-hidden="true"
        >
          <UserRound className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-xl font-bold tracking-tight">
            {player.name}
          </h3>
          {player.nickname ? (
            <p className="truncate text-base text-muted-foreground">
              «{player.nickname}»
            </p>
          ) : (
            <p className="text-base text-muted-foreground">Sin apodo</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className="px-3 py-1.5 text-sm"
          data-ocid={`roster.position_badge.${index + 1}`}
        >
          {position}
        </Badge>
        {hasPhone ? (
          <a
            href={phoneHref(player.phone)}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 py-1.5 text-base font-semibold text-foreground transition-smooth hover:bg-secondary hover:text-secondary-foreground"
            data-ocid={`roster.phone_link.${index + 1}`}
          >
            <Phone className="size-4" aria-hidden="true" />
            {player.phone}
          </a>
        ) : (
          <span className="text-base text-muted-foreground">
            Sin teléfono de contacto
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button asChild variant="outline" className="gap-2">
          <Link
            to="/plantel/$playerId"
            params={{ playerId: player.id.toString() }}
            data-ocid={`roster.view_button.${index + 1}`}
          >
            Ver ficha
          </Link>
        </Button>
        {canManage ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => onEdit(player)}
              data-ocid={`roster.edit_button.${index + 1}`}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(player)}
              data-ocid={`roster.delete_button.${index + 1}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Dar de baja
            </Button>
          </>
        ) : null}
      </div>
    </article>
  );
}
