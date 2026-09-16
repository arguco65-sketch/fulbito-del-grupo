import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  type MockBackend,
  type MockBackendState,
  createMockBackend,
  installCoreInfrastructureMock,
  makeMatch,
  makePlayer,
  makeSummary,
  renderApp,
} from "@/test/harness";

let backend: MockBackend;
let state: MockBackendState;

describe("Próximos partidos", () => {
  it("muestra los partidos ordenados con su lugar, hora y cupos restantes", async () => {
    const first = makeMatch({
      id: 1n,
      date: "2026-10-10",
      time: "20:00",
      place: "Cancha 1, Complejo Los Álamos",
      maxPlayers: 12n,
    });
    const second = makeMatch({
      id: 2n,
      date: "2026-10-17",
      time: "19:30",
      place: "Cancha 2",
      maxPlayers: 10n,
    });

    ({ backend, state } = createMockBackend({
      upcomingMatches: [first, second],
      summaries: new Map([
        ["1", makeSummary({ matchId: 1n, spotsLeft: 9n })],
        ["2", makeSummary({ matchId: 2n, spotsLeft: 10n })],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp();

    expect(
      await screen.findByRole("heading", { name: "Próximos partidos" }),
    ).toBeInTheDocument();

    const items = await screen.findAllByRole("article");
    expect(items).toHaveLength(2);

    expect(
      screen.getByText("Cancha 1, Complejo Los Álamos"),
    ).toBeInTheDocument();
    expect(screen.getByText("20:00")).toBeInTheDocument();
    expect(screen.getByText("Cancha 2")).toBeInTheDocument();
    expect(screen.getByText("19:30")).toBeInTheDocument();

    // El contador de cupos se deriva del resumen de asistencia del backend.
    expect(await screen.findByText("Quedan 9 cupos")).toBeInTheDocument();
    expect(await screen.findByText("Quedan 10 cupos")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay partidos programados", async () => {
    ({ backend, state } = createMockBackend({ upcomingMatches: [] }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp();

    expect(
      await screen.findByText("No hay partidos programados"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Cuando el organizador programe un partido, aparecerá aquí.",
      ),
    ).toBeInTheDocument();
  });

  it("no ofrece programar partidos a un jugador", async () => {
    ({ backend, state } = createMockBackend({ upcomingMatches: [] }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "user";

    renderApp();

    await screen.findByText("No hay partidos programados");
    expect(
      screen.queryByRole("button", { name: /programar partido/i }),
    ).not.toBeInTheDocument();
  });

  it("permite al organizador programar un partido y lo envía al backend", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({ upcomingMatches: [] }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp();

    // El organizador ve el botón en el encabezado de la página y, con la lista
    // vacía, otro en el estado vacío. Cualquiera abre el mismo formulario.
    const [openButton] = await screen.findAllByRole("button", {
      name: /programar partido/i,
    });
    await user.click(openButton);

    await user.type(screen.getByLabelText("Fecha"), "2026-11-05");
    await user.type(screen.getByLabelText("Hora"), "21:00");
    await user.type(screen.getByLabelText("Lugar"), "Cancha 3");
    await user.clear(screen.getByLabelText("Cupo máximo de jugadores"));
    await user.type(screen.getByLabelText("Cupo máximo de jugadores"), "14");

    await user.click(screen.getByRole("button", { name: "Programar partido" }));

    await waitFor(() => {
      expect(backend.createMatch).toHaveBeenCalledWith({
        date: "2026-11-05",
        time: "21:00",
        place: "Cancha 3",
        maxPlayers: 14n,
      });
    });
  });

  it("no envía al backend un cupo máximo inválido", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({ upcomingMatches: [] }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp();

    const [openButton] = await screen.findAllByRole("button", {
      name: /programar partido/i,
    });
    await user.click(openButton);

    await user.type(screen.getByLabelText("Fecha"), "2026-11-05");
    await user.type(screen.getByLabelText("Hora"), "21:00");
    await user.type(screen.getByLabelText("Lugar"), "Cancha 3");
    await user.clear(screen.getByLabelText("Cupo máximo de jugadores"));
    await user.type(screen.getByLabelText("Cupo máximo de jugadores"), "1");

    await user.click(screen.getByRole("button", { name: "Programar partido" }));

    // El formulario no debe llegar al backend con un cupo por debajo del mínimo.
    await waitFor(() => {
      expect(backend.createMatch).not.toHaveBeenCalled();
    });
  });
});

describe("Navegación principal", () => {
  it("expone secciones claras para Partidos, Plantel e Historial", async () => {
    ({ backend, state } = createMockBackend({}));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp();

    const nav = await screen.findByRole("navigation", {
      name: "Secciones principales",
    });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /partidos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /plantel/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /historial/i }),
    ).toBeInTheDocument();
  });

  it("navega al plantel desde el encabezado", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      players: [makePlayer({ id: 1n, name: "Ana Gómez" })],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp();

    await user.click(await screen.findByRole("link", { name: /plantel/i }));

    expect(
      await screen.findByRole("heading", { name: "Plantel" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Ana Gómez")).toBeInTheDocument();
  });
});
