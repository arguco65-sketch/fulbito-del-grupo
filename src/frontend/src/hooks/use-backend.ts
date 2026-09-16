import { createActor } from "@/backend";
import type {
  AttendanceSummary,
  AttendanceView,
  MatchHistoryEntry,
  MatchInput,
  MatchResultInput,
  MatchResultView,
  MatchView,
  PlayerInput,
  PlayerView,
} from "@/types/app";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* -------------------------------------------------------------------------- */
/* Plantel de jugadores                                                       */
/* -------------------------------------------------------------------------- */

export function usePlayers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["players"],
    queryFn: async (): Promise<PlayerView[]> => {
      if (!actor) return [];
      return actor.listPlayers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePlayer(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["player", id?.toString() ?? "none"],
    queryFn: async (): Promise<PlayerView | null> => {
      if (!actor || id === null) return null;
      return actor.getPlayer(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useSearchPlayers(term: string) {
  const { actor, isFetching } = useActor(createActor);
  const trimmed = term.trim();
  return useQuery({
    queryKey: ["players", "search", trimmed],
    queryFn: async (): Promise<PlayerView[]> => {
      if (!actor) return [];
      return actor.searchPlayers(trimmed);
    },
    enabled: !!actor && !isFetching && trimmed.length > 0,
  });
}

export function useCreatePlayer() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlayerInput): Promise<bigint> => {
      if (!actor) throw new Error("El backend todavía no está listo");
      return actor.createPlayer(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}

export function useUpdatePlayer() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: PlayerInput }): Promise<void> => {
      if (!actor) throw new Error("El backend todavía no está listo");
      return actor.updatePlayer(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["players"] });
      void queryClient.invalidateQueries({ queryKey: ["player"] });
    },
  });
}

export function useDeletePlayer() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint): Promise<void> => {
      if (!actor) throw new Error("El backend todavía no está listo");
      return actor.deletePlayer(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Partidos                                                                   */
/* -------------------------------------------------------------------------- */

export function useUpcomingMatches() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["matches", "upcoming"],
    queryFn: async (): Promise<MatchView[]> => {
      if (!actor) return [];
      return actor.listUpcomingMatches();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllMatches() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["matches", "all"],
    queryFn: async (): Promise<MatchView[]> => {
      if (!actor) return [];
      return actor.listAllMatches();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMatch(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["match", id?.toString() ?? "none"],
    queryFn: async (): Promise<MatchView | null> => {
      if (!actor || id === null) return null;
      return actor.getMatch(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateMatch() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MatchInput): Promise<bigint> => {
      if (!actor) throw new Error("El backend todavía no está listo");
      return actor.createMatch(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useUpdateMatch() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: MatchInput }): Promise<void> => {
      if (!actor) throw new Error("El backend todavía no está listo");
      return actor.updateMatch(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
      void queryClient.invalidateQueries({ queryKey: ["match"] });
    },
  });
}

export function useCancelMatch() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint): Promise<void> => {
      if (!actor) throw new Error("El backend todavía no está listo");
      return actor.cancelMatch(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
      void queryClient.invalidateQueries({ queryKey: ["match"] });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Asistencia                                                                 */
/* -------------------------------------------------------------------------- */

export function useAttendanceSummary(matchId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["attendance", "summary", matchId?.toString() ?? "none"],
    queryFn: async (): Promise<AttendanceSummary | null> => {
      if (!actor || matchId === null) return null;
      return actor.getAttendanceSummary(matchId);
    },
    enabled: !!actor && !isFetching && matchId !== null,
  });
}

export function usePlayerAttendance(playerId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["attendance", "player", playerId?.toString() ?? "none"],
    queryFn: async (): Promise<AttendanceView[]> => {
      if (!actor || playerId === null) return [];
      return actor.getPlayerAttendance(playerId);
    },
    enabled: !!actor && !isFetching && playerId !== null,
  });
}

export function useSetAttendance() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      matchId,
      playerId,
      confirmed,
    }: {
      matchId: bigint;
      playerId: bigint;
      confirmed: boolean;
    }): Promise<void> => {
      if (!actor) throw new Error("El backend todavía no está listo");
      return actor.setAttendance(matchId, playerId, confirmed);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["attendance"] });
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Resultados e historial                                                     */
/* -------------------------------------------------------------------------- */

export function useResult(matchId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["result", matchId?.toString() ?? "none"],
    queryFn: async (): Promise<MatchResultView | null> => {
      if (!actor || matchId === null) return null;
      return actor.getResult(matchId);
    },
    enabled: !!actor && !isFetching && matchId !== null,
  });
}

export function useRecordResult() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      matchId,
      input,
    }: {
      matchId: bigint;
      input: MatchResultInput;
    }): Promise<void> => {
      if (!actor) throw new Error("El backend todavía no está listo");
      return actor.recordResult(matchId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["result"] });
      void queryClient.invalidateQueries({ queryKey: ["history"] });
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useMatchHistory() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["history"],
    queryFn: async (): Promise<MatchHistoryEntry[]> => {
      if (!actor) return [];
      return actor.listHistory();
    },
    enabled: !!actor && !isFetching,
  });
}
