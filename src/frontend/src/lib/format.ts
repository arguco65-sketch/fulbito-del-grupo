import type { MatchView, PlayerView } from "@/types/app";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
});

const POSITION_LABELS: Record<string, string> = {
  portero: "Portero",
  defensa: "Defensa",
  mediocampista: "Mediocampista",
  delantero: "Delantero",
};

/**
 * Convierte una fecha del backend ("YYYY-MM-DD") en un Date local.
 * Devuelve null si el texto no es una fecha válida.
 */
export function parseMatchDate(date: string): Date | null {
  const parts = date.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map((part) => Number(part));
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Fecha larga en español: "sábado, 12 de septiembre de 2026". */
export function formatMatchDate(date: string): string {
  const parsed = parseMatchDate(date);
  if (!parsed) return date;
  return DATE_FORMATTER.format(parsed);
}

/** Fecha corta para listas: "12 sept". */
export function formatShortDate(date: string): string {
  const parsed = parseMatchDate(date);
  if (!parsed) return date;
  return SHORT_DATE_FORMATTER.format(parsed);
}

/** Hora del partido, ya guardada como "HH:MM". */
export function formatMatchTime(time: string): string {
  return time || "Sin hora";
}

/** Día de la semana en mayúsculas cortas: "SÁB". */
export function formatWeekdayBadge(date: string): string {
  const parsed = parseMatchDate(date);
  if (!parsed) return "—";
  return new Intl.DateTimeFormat("es-ES", { weekday: "short" })
    .format(parsed)
    .replace(".", "")
    .toUpperCase();
}

/** Día del mes para el bloque de calendario: "12". */
export function formatDayBadge(date: string): string {
  const parsed = parseMatchDate(date);
  if (!parsed) return "—";
  return String(parsed.getDate());
}

/** Mes corto para el bloque de calendario: "SEP". */
export function formatMonthBadge(date: string): string {
  const parsed = parseMatchDate(date);
  if (!parsed) return "—";
  return new Intl.DateTimeFormat("es-ES", { month: "short" })
    .format(parsed)
    .replace(".", "")
    .toUpperCase();
}

/** Nombre completo con apodo entre paréntesis cuando existe. */
export function formatPlayerName(
  player: Pick<PlayerView, "name" | "nickname">,
): string {
  return player.nickname ? `${player.name} (${player.nickname})` : player.name;
}

/** Etiqueta legible de la posición habitual. */
export function formatPosition(position: string): string {
  if (!position) return "Sin posición";
  return POSITION_LABELS[position.toLowerCase()] ?? position;
}

/** Teléfono listo para marcar: solo dígitos y prefijo +. */
export function phoneHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

/** Texto de cupos: "Quedan 3 cupos" / "Sin cupos". */
export function formatSpotsLeft(spotsLeft: number): string {
  if (spotsLeft <= 0) return "Sin cupos";
  if (spotsLeft === 1) return "Queda 1 cupo";
  return `Quedan ${spotsLeft} cupos`;
}

/** Texto de cupos ocupados: "8 de 12 confirmados". */
export function formatCapacity(
  confirmedCount: number,
  maxPlayers: number,
): string {
  return `${confirmedCount} de ${maxPlayers} confirmados`;
}

/** Marcador final: "3 - 2". */
export function formatScore(goalsTeamA: bigint, goalsTeamB: bigint): string {
  return `${goalsTeamA.toString()} - ${goalsTeamB.toString()}`;
}

/** Fecha de un partido ya jugado, con resultado si existe. */
export function formatHistoryLabel(entry: { match: MatchView }): string {
  return `${formatMatchDate(entry.match.date)} · ${formatMatchTime(entry.match.time)}`;
}
