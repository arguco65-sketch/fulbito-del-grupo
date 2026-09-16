import type {
  AttendanceSummary,
  AttendanceView,
  MatchHistoryEntry,
  MatchResultView,
  MatchView,
  PlayerView,
} from "@/types/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { type RenderResult, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { Layout } from "@/components/Layout";
import { HistoryPage } from "@/pages/HistoryPage";
import { MatchDetailPage } from "@/pages/MatchDetailPage";
import { MatchesPage } from "@/pages/MatchesPage";
import { PlayerDetailPage } from "@/pages/PlayerDetailPage";
import { RosterPage } from "@/pages/RosterPage";

/* -------------------------------------------------------------------------- */
/* Typed actor mock                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The subset of the generated `Backend` surface the pages under test call.
 * Every method is a `vi.fn` so a test can assert the exact call the UI made.
 */
export interface MockBackend {
  listPlayers: ReturnType<typeof vi.fn>;
  getPlayer: ReturnType<typeof vi.fn>;
  searchPlayers: ReturnType<typeof vi.fn>;
  createPlayer: ReturnType<typeof vi.fn>;
  updatePlayer: ReturnType<typeof vi.fn>;
  deletePlayer: ReturnType<typeof vi.fn>;
  listUpcomingMatches: ReturnType<typeof vi.fn>;
  listAllMatches: ReturnType<typeof vi.fn>;
  getMatch: ReturnType<typeof vi.fn>;
  createMatch: ReturnType<typeof vi.fn>;
  updateMatch: ReturnType<typeof vi.fn>;
  cancelMatch: ReturnType<typeof vi.fn>;
  getAttendanceSummary: ReturnType<typeof vi.fn>;
  getPlayerAttendance: ReturnType<typeof vi.fn>;
  setAttendance: ReturnType<typeof vi.fn>;
  getResult: ReturnType<typeof vi.fn>;
  recordResult: ReturnType<typeof vi.fn>;
  listHistory: ReturnType<typeof vi.fn>;
  getCallerUserRole: ReturnType<typeof vi.fn>;
}

export interface MockBackendState {
  players: PlayerView[];
  upcomingMatches: MatchView[];
  allMatches: MatchView[];
  summaries: Map<string, AttendanceSummary>;
  results: Map<string, MatchResultView>;
  history: MatchHistoryEntry[];
  attendanceByPlayer: Map<string, AttendanceView[]>;
  role: "admin" | "user" | "guest";
}

export function createMockBackend(overrides: Partial<MockBackendState> = {}): {
  backend: MockBackend;
  state: MockBackendState;
} {
  const state: MockBackendState = {
    players: [],
    upcomingMatches: [],
    allMatches: [],
    summaries: new Map(),
    results: new Map(),
    history: [],
    attendanceByPlayer: new Map(),
    role: "user",
    ...overrides,
  };

  const backend: MockBackend = {
    listPlayers: vi.fn(async () => state.players),
    getPlayer: vi.fn(async (id: bigint) => {
      return state.players.find((player) => player.id === id) ?? null;
    }),
    searchPlayers: vi.fn(async (term: string) => {
      const needle = term.trim().toLowerCase();
      return state.players.filter(
        (player) =>
          player.name.toLowerCase().includes(needle) ||
          player.nickname.toLowerCase().includes(needle),
      );
    }),
    createPlayer: vi.fn(async () => 1n),
    updatePlayer: vi.fn(async () => undefined),
    deletePlayer: vi.fn(async () => undefined),
    listUpcomingMatches: vi.fn(async () => state.upcomingMatches),
    listAllMatches: vi.fn(async () => state.allMatches),
    getMatch: vi.fn(async (id: bigint) => {
      return (
        state.allMatches.find((match) => match.id === id) ??
        state.upcomingMatches.find((match) => match.id === id) ??
        null
      );
    }),
    createMatch: vi.fn(async () => 1n),
    updateMatch: vi.fn(async () => undefined),
    cancelMatch: vi.fn(async () => undefined),
    getAttendanceSummary: vi.fn(async (matchId: bigint) => {
      return state.summaries.get(matchId.toString()) ?? null;
    }),
    getPlayerAttendance: vi.fn(async (playerId: bigint) => {
      return state.attendanceByPlayer.get(playerId.toString()) ?? [];
    }),
    setAttendance: vi.fn(async () => undefined),
    getResult: vi.fn(async (matchId: bigint) => {
      return state.results.get(matchId.toString()) ?? null;
    }),
    recordResult: vi.fn(async () => undefined),
    listHistory: vi.fn(async () => state.history),
    getCallerUserRole: vi.fn(async () => state.role),
  };

  return { backend, state };
}

/* -------------------------------------------------------------------------- */
/* Module mocks                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The actor and session the app reads from `@caffeineai/core-infrastructure`.
 * `vi.mock` is hoisted above the imports, so the factory reads this mutable
 * holder at call time rather than closing over a value that does not exist yet.
 */
export const coreInfrastructureMock: {
  backend: MockBackend | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  login: () => void;
  logout: () => void;
} = {
  backend: null,
  isAuthenticated: true,
  isInitializing: false,
  isLoggingIn: false,
  login: () => {},
  logout: () => {},
};

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({
    actor: coreInfrastructureMock.backend,
    isFetching: false,
  }),
  useInternetIdentity: () => ({
    identity: undefined,
    login: coreInfrastructureMock.login,
    clear: coreInfrastructureMock.logout,
    loginStatus: coreInfrastructureMock.isInitializing
      ? "initializing"
      : coreInfrastructureMock.isAuthenticated
        ? "success"
        : "idle",
    isInitializing: coreInfrastructureMock.isInitializing,
    isLoginIdle:
      !coreInfrastructureMock.isAuthenticated &&
      !coreInfrastructureMock.isInitializing,
    isLoggingIn: coreInfrastructureMock.isLoggingIn,
    isLoginSuccess: coreInfrastructureMock.isAuthenticated,
    isLoginError: false,
    isAuthenticated: coreInfrastructureMock.isAuthenticated,
    loginError: undefined,
  }),
}));

/**
 * Points the mocked core-infrastructure seam at a fresh actor mock. The pages
 * under test never touch a real canister or a real identity provider.
 */
export function installCoreInfrastructureMock(options: {
  backend: MockBackend;
  isAuthenticated?: boolean;
  isInitializing?: boolean;
  isLoggingIn?: boolean;
  login?: () => void;
  logout?: () => void;
}): void {
  coreInfrastructureMock.backend = options.backend;
  coreInfrastructureMock.isAuthenticated = options.isAuthenticated ?? true;
  coreInfrastructureMock.isInitializing = options.isInitializing ?? false;
  coreInfrastructureMock.isLoggingIn = options.isLoggingIn ?? false;
  coreInfrastructureMock.login = options.login ?? (() => {});
  coreInfrastructureMock.logout = options.logout ?? (() => {});
}

/* -------------------------------------------------------------------------- */
/* Router harness                                                             */
/* -------------------------------------------------------------------------- */

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: MatchesPage,
});

const matchDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/partidos/$matchId",
  component: MatchDetailPage,
});

const rosterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/plantel",
  component: RosterPage,
});

const playerDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/plantel/$playerId",
  component: PlayerDetailPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/historial",
  component: HistoryPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  matchDetailRoute,
  rosterRoute,
  playerDetailRoute,
  historyRoute,
]);

export interface RenderAppOptions {
  /** Initial URL, e.g. `/partidos/1`. */
  initialPath?: string;
}

/**
 * Renders the real page components inside the real router, query client and
 * layout providers, with the backend actor mocked locally.
 */
export function renderApp({
  initialPath = "/",
}: RenderAppOptions = {}): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return render(
    <Wrapper>
      <RouterProvider router={router} />
    </Wrapper>,
  );
}

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

export function makePlayer(
  overrides: Partial<PlayerView> & { id: bigint },
): PlayerView {
  return {
    name: "Jugador",
    nickname: "",
    position: "mediocampista",
    phone: "",
    createdAt: 0n,
    ...overrides,
  };
}

export function makeMatch(
  overrides: Partial<MatchView> & { id: bigint },
): MatchView {
  return {
    date: "2026-10-10",
    time: "20:00",
    place: "Cancha 1",
    maxPlayers: 12n,
    cancelled: false,
    createdAt: 0n,
    ...overrides,
  };
}

export function makeSummary(
  overrides: Partial<AttendanceSummary> & { matchId: bigint },
): AttendanceSummary {
  return {
    confirmed: [],
    declined: [],
    pending: [],
    spotsLeft: 12n,
    ...overrides,
  };
}
