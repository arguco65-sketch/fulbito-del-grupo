import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  type MockBackend,
  createMockBackend,
  installCoreInfrastructureMock,
  makeMatch,
  makePlayer,
  renderApp,
} from "@/test/harness";

let backend: MockBackend;

describe("Historial de partidos", () => {
  it("muestra los partidos jugados con su resultado y quiénes asistieron", async () => {
    ({ backend } = createMockBackend({
      players: [
        makePlayer({
          id: 1n,
          name: "Ana Gómez",
          nickname: "La Gome",
          position: "delantero",
        }),
        makePlayer({
          id: 2n,
          name: "Beto Ruiz",
          nickname: "",
          position: "portero",
        }),
      ],
      history: [
        {
          match: makeMatch({
            id: 1n,
            date: "2026-09-12",
            time: "20:00",
            place: "Cancha 1",
            maxPlayers: 12n,
          }),
          result: {
            matchId: 1n,
            teamA: [1n],
            teamB: [2n],
            goalsTeamA: 3n,
            goalsTeamB: 2n,
            recordedAt: 0n,
          },
          players: [1n, 2n],
        },
      ],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/historial" });

    expect(
      await screen.findByRole("heading", { name: "Historial de partidos" }),
    ).toBeInTheDocument();

    expect(await screen.findByText("3 - 2")).toBeInTheDocument();
    expect(screen.getByText("Ana Gómez (La Gome)")).toBeInTheDocument();
    expect(screen.getByText("Beto Ruiz")).toBeInTheDocument();
    expect(screen.getByText("Equipo A")).toBeInTheDocument();
    expect(screen.getByText("Equipo B")).toBeInTheDocument();
    expect(screen.getByText("2 de 12 confirmados")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando todavía no hay partidos jugados", async () => {
    ({ backend } = createMockBackend({ history: [] }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/historial" });

    expect(
      await screen.findByText("Todavía no hay partidos jugados"),
    ).toBeInTheDocument();
  });

  it("indica cuando un partido del historial no tiene resultado", async () => {
    ({ backend } = createMockBackend({
      players: [makePlayer({ id: 1n, name: "Ana Gómez" })],
      history: [
        {
          match: makeMatch({ id: 1n, date: "2026-09-12" }),
          players: [1n],
        },
      ],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/historial" });

    expect(
      await screen.findByText("Sin resultado registrado"),
    ).toBeInTheDocument();
  });
});
