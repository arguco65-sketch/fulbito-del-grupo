import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { HistoryPage } from "@/pages/HistoryPage";
import { MatchDetailPage } from "@/pages/MatchDetailPage";
import { MatchesPage } from "@/pages/MatchesPage";
import { PlayerDetailPage } from "@/pages/PlayerDetailPage";
import { RosterPage } from "@/pages/RosterPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
      <Toaster position="top-center" richColors />
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

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
