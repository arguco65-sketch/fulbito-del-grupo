import { createActor } from "@/backend";
import type { AppRole, PlayerView } from "@/types/app";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

const CURRENT_PLAYER_KEY = "fulbito.currentPlayerId";

/**
 * Lee el jugador elegido en este dispositivo. Se guarda solo el identificador
 * para que el nombre siempre provenga del plantel actual del backend.
 */
function readStoredPlayerId(): bigint | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CURRENT_PLAYER_KEY);
  if (!raw || !/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

/**
 * Estado de sesión del grupo: identidad, rol efectivo y acciones de acceso.
 * El organizador corresponde al rol admin del backend; el primer usuario
 * que inicia sesión queda como organizador.
 */
export function useIdentity() {
  const {
    identity,
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    loginError,
  } = useInternetIdentity();
  const { actor, isFetching } = useActor(createActor);

  const roleQuery = useQuery({
    queryKey: ["caller-role", identity?.getPrincipal().toText() ?? "anon"],
    queryFn: async (): Promise<AppRole> => {
      if (!actor) return "guest";
      const role = await actor.getCallerUserRole();
      if (role === "admin") return "organizer";
      if (role === "user") return "player";
      return "guest";
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  const role: AppRole = isAuthenticated
    ? (roleQuery.data ?? "player")
    : "guest";

  return {
    identity,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    loginError,
    role,
    isOrganizer: role === "organizer",
    isRoleLoading: isAuthenticated && roleQuery.isLoading,
    login,
    logout: clear,
  };
}

/**
 * Resuelve qué integrante del plantel representa al usuario actual.
 *
 * El backend no expone una relación principal→jugador, así que la persona
 * elige explícitamente "¿Quién eres?" sobre el plantel y la elección se
 * recuerda en este dispositivo. El identificador guardado se valida contra
 * el plantel real: si el jugador ya no existe, la selección se limpia.
 */
export function useCurrentPlayer(players: PlayerView[] | undefined) {
  const [playerId, setPlayerId] = useState<bigint | null>(() =>
    readStoredPlayerId(),
  );

  const roster = players ?? [];
  const currentPlayer =
    playerId === null
      ? null
      : (roster.find((player) => player.id === playerId) ?? null);

  // Si el jugador guardado ya no está en el plantel, se descarta la elección.
  useEffect(() => {
    if (playerId === null || players === undefined) return;
    if (roster.some((player) => player.id === playerId)) return;
    setPlayerId(null);
    window.localStorage.removeItem(CURRENT_PLAYER_KEY);
  }, [playerId, players, roster]);

  const selectPlayer = useCallback((id: bigint | null) => {
    setPlayerId(id);
    if (id === null) {
      window.localStorage.removeItem(CURRENT_PLAYER_KEY);
      return;
    }
    window.localStorage.setItem(CURRENT_PLAYER_KEY, id.toString());
  }, []);

  return { currentPlayer, selectPlayer };
}
