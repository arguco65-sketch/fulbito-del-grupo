import type {
  AttendanceSummary,
  AttendanceView,
  ConfirmedPlayer,
  MatchHistoryEntry,
  MatchInput,
  MatchResultInput,
  MatchResultView,
  MatchView,
  PlayerInput,
  PlayerView,
} from "@/backend";

export type {
  AttendanceSummary,
  AttendanceView,
  ConfirmedPlayer,
  MatchHistoryEntry,
  MatchInput,
  MatchResultInput,
  MatchResultView,
  MatchView,
  PlayerInput,
  PlayerView,
};

/** Rol efectivo del usuario dentro del grupo. */
export type AppRole = "organizer" | "player" | "guest";

/** Estado de asistencia de un jugador a un partido. */
export type AttendanceAnswer = "confirmed" | "declined" | "pending";

/** Fila de asistencia lista para mostrar en pantalla. */
export interface AttendanceRow {
  player: PlayerView;
  answer: AttendanceAnswer;
}

/** Resumen de cupos de un partido. */
export interface MatchCapacity {
  confirmedCount: number;
  spotsLeft: number;
  isFull: boolean;
}
