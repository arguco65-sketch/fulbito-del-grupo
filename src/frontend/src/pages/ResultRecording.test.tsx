import { screen, waitFor, within } from "@testing-library/react";
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

/**
 * Línea base del registro de resultados y su reflejo en el historial.
 *
 * El pedido cambia a propósito los requisitos de "al menos un confirmado" y
 * "un jugador por equipo". Estas pruebas NO cubren esos límites: protegen el
 * comportamiento vecino que debe seguir igual — la visibilidad por rol, el
 * envío correcto del resultado cuando sí hay equipos, la lectura del panel y
 * el historial.
 */

let backend: MockBackend;
let state: MockBackendState;

const ANA = makePlayer({
  id: 1n,
  name: "Ana Gómez",
  nickname: "La Gome",
  position: "delantero",
});
const BETO = makePlayer({
  id: 2n,
  name: "Beto Ruiz",
  nickname: "",
  position: "portero",
});

const ANA_CONFIRMED = {
  playerId: 1n,
  name: "Ana Gómez",
  nickname: "La Gome",
  position: "delantero",
};
const BETO_CONFIRMED = {
  playerId: 2n,
  name: "Beto Ruiz",
  nickname: "",
  position: "portero",
};

describe("Registro del resultado: visibilidad por rol", () => {
  it("no ofrece registrar el resultado a un jugador que no es organizador", async () => {
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n })],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            confirmed: [ANA_CONFIRMED, BETO_CONFIRMED],
            spotsLeft: 10n,
          }),
        ],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "user";

    renderApp({ initialPath: "/partidos/1" });

    // El panel de asistencia sí carga, pero la sección de resultado no aparece.
    await screen.findByTestId("attendance.panel");
    expect(
      screen.queryByRole("button", { name: "Registrar resultado" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("match_detail.result_empty_state"),
    ).not.toBeInTheDocument();
  });

  it("muestra el resultado ya registrado en modo lectura a un jugador", async () => {
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n })],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            confirmed: [ANA_CONFIRMED, BETO_CONFIRMED],
            spotsLeft: 10n,
          }),
        ],
      ]),
      results: new Map([
        [
          "1",
          {
            matchId: 1n,
            teamA: [1n],
            teamB: [2n],
            goalsTeamA: 3n,
            goalsTeamB: 2n,
            recordedAt: 0n,
          },
        ],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "user";

    renderApp({ initialPath: "/partidos/1" });

    expect(
      await screen.findByRole("heading", { name: "Resultado final" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 - 2")).toBeInTheDocument();
    // Sin rol de organizador no hay acción de corrección.
    expect(
      screen.queryByRole("button", { name: "Editar resultado" }),
    ).not.toBeInTheDocument();
  });
});

describe("Registro del resultado: envío al backend", () => {
  it("envía el marcador y los equipos con el contrato tipado del actor", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n, maxPlayers: 12n })],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            confirmed: [ANA_CONFIRMED, BETO_CONFIRMED],
            spotsLeft: 10n,
          }),
        ],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp({ initialPath: "/partidos/1" });

    await user.click(
      await screen.findByRole("button", { name: "Registrar resultado" }),
    );

    const dialog = await screen.findByRole("dialog");
    await user.clear(within(dialog).getByLabelText("Goles del Equipo A"));
    await user.type(within(dialog).getByLabelText("Goles del Equipo A"), "4");
    await user.clear(within(dialog).getByLabelText("Goles del Equipo B"));
    await user.type(within(dialog).getByLabelText("Goles del Equipo B"), "1");

    await user.click(
      within(
        within(dialog).getByRole("group", { name: "Equipo de Ana Gómez" }),
      ).getByRole("button", { name: "Equipo A" }),
    );
    await user.click(
      within(
        within(dialog).getByRole("group", { name: "Equipo de Beto Ruiz" }),
      ).getByRole("button", { name: "Equipo B" }),
    );

    await user.click(
      within(dialog).getByRole("button", { name: "Guardar resultado" }),
    );

    await waitFor(() => {
      expect(backend.recordResult).toHaveBeenCalledTimes(1);
    });
    expect(backend.recordResult).toHaveBeenCalledWith(1n, {
      teamA: [1n],
      teamB: [2n],
      goalsTeamA: 4n,
      goalsTeamB: 1n,
    });
  });

  it("precarga el resultado existente al abrir el formulario de edición", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n })],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            confirmed: [ANA_CONFIRMED, BETO_CONFIRMED],
            spotsLeft: 10n,
          }),
        ],
      ]),
      results: new Map([
        [
          "1",
          {
            matchId: 1n,
            teamA: [1n],
            teamB: [2n],
            goalsTeamA: 3n,
            goalsTeamB: 2n,
            recordedAt: 0n,
          },
        ],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp({ initialPath: "/partidos/1" });

    await user.click(
      await screen.findByRole("button", { name: "Editar resultado" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("Goles del Equipo A")).toHaveValue(3);
    expect(within(dialog).getByLabelText("Goles del Equipo B")).toHaveValue(2);
    // Los equipos guardados se reflejan en el estado de los botones.
    expect(
      within(
        within(dialog).getByRole("group", { name: "Equipo de Ana Gómez" }),
      ).getByRole("button", { name: "Equipo A" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(
        within(dialog).getByRole("group", { name: "Equipo de Beto Ruiz" }),
      ).getByRole("button", { name: "Equipo B" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

describe("Registro del resultado: participantes desde todo el plantel", () => {
  it("permite al organizador abrir el formulario y guardar con cero confirmados", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n, maxPlayers: 12n })],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            confirmed: [],
            pending: [ANA_CONFIRMED, BETO_CONFIRMED],
            spotsLeft: 12n,
          }),
        ],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp({ initialPath: "/partidos/1" });

    // Sin confirmados el organizador igual puede registrar el resultado.
    await user.click(
      await screen.findByRole("button", { name: "Registrar resultado" }),
    );

    const dialog = await screen.findByRole("dialog");
    // El plantel completo está disponible para elegir participantes.
    expect(
      within(dialog).getByText("Participantes (2 en el plantel)"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("group", { name: "Equipo de Ana Gómez" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("group", { name: "Equipo de Beto Ruiz" }),
    ).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText("Goles del Equipo A"));
    await user.type(within(dialog).getByLabelText("Goles del Equipo A"), "2");
    await user.clear(within(dialog).getByLabelText("Goles del Equipo B"));
    await user.type(within(dialog).getByLabelText("Goles del Equipo B"), "2");

    await user.click(
      within(
        within(dialog).getByRole("group", { name: "Equipo de Ana Gómez" }),
      ).getByRole("button", { name: "Equipo A" }),
    );
    await user.click(
      within(
        within(dialog).getByRole("group", { name: "Equipo de Beto Ruiz" }),
      ).getByRole("button", { name: "Equipo B" }),
    );

    await user.click(
      within(dialog).getByRole("button", { name: "Guardar resultado" }),
    );

    await waitFor(() => {
      expect(backend.recordResult).toHaveBeenCalledWith(1n, {
        teamA: [1n],
        teamB: [2n],
        goalsTeamA: 2n,
        goalsTeamB: 2n,
      });
    });
  });

  it("marca a los confirmados y deja elegir al resto del plantel", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n, maxPlayers: 12n })],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            confirmed: [ANA_CONFIRMED],
            pending: [BETO_CONFIRMED],
            spotsLeft: 11n,
          }),
        ],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp({ initialPath: "/partidos/1" });

    await user.click(
      await screen.findByRole("button", { name: "Registrar resultado" }),
    );

    const dialog = await screen.findByRole("dialog");
    // Ana está confirmada y lleva su distintivo; Beto no.
    expect(
      within(dialog).getByTestId("result_form.confirmed_badge.1"),
    ).toHaveTextContent("Confirmado");
    expect(
      within(dialog).queryByTestId("result_form.confirmed_badge.2"),
    ).not.toBeInTheDocument();

    // Aun sin estar confirmado, Beto se puede asignar a un equipo.
    await user.click(
      within(
        within(dialog).getByRole("group", { name: "Equipo de Beto Ruiz" }),
      ).getByRole("button", { name: "Equipo A" }),
    );
    expect(
      within(
        within(dialog).getByRole("group", { name: "Equipo de Beto Ruiz" }),
      ).getByRole("button", { name: "Equipo A" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("envía el marcador y los equipos con un solo confirmado", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n, maxPlayers: 12n })],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            confirmed: [ANA_CONFIRMED],
            pending: [BETO_CONFIRMED],
            spotsLeft: 11n,
          }),
        ],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp({ initialPath: "/partidos/1" });

    await user.click(
      await screen.findByRole("button", { name: "Registrar resultado" }),
    );

    const dialog = await screen.findByRole("dialog");
    await user.clear(within(dialog).getByLabelText("Goles del Equipo A"));
    await user.type(within(dialog).getByLabelText("Goles del Equipo A"), "5");
    await user.clear(within(dialog).getByLabelText("Goles del Equipo B"));
    await user.type(within(dialog).getByLabelText("Goles del Equipo B"), "3");

    await user.click(
      within(
        within(dialog).getByRole("group", { name: "Equipo de Ana Gómez" }),
      ).getByRole("button", { name: "Equipo A" }),
    );
    await user.click(
      within(
        within(dialog).getByRole("group", { name: "Equipo de Beto Ruiz" }),
      ).getByRole("button", { name: "Equipo B" }),
    );

    await user.click(
      within(dialog).getByRole("button", { name: "Guardar resultado" }),
    );

    await waitFor(() => {
      expect(backend.recordResult).toHaveBeenCalledWith(1n, {
        teamA: [1n],
        teamB: [2n],
        goalsTeamA: 5n,
        goalsTeamB: 3n,
      });
    });
  });
});

describe("Historial: resultado y participantes", () => {
  it("muestra el marcador y los equipos de cada partido jugado", async () => {
    ({ backend, state } = createMockBackend({
      players: [ANA, BETO],
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

    const card = await screen.findByTestId("history.item.1");
    expect(within(card).getByText("3 - 2")).toBeInTheDocument();
    expect(within(card).getByText("Ana Gómez (La Gome)")).toBeInTheDocument();
    expect(within(card).getByText("Beto Ruiz")).toBeInTheDocument();
    expect(within(card).getByText("Equipo A")).toBeInTheDocument();
    expect(within(card).getByText("Equipo B")).toBeInTheDocument();
    expect(within(card).getByText("2 de 12 confirmados")).toBeInTheDocument();
  });

  it("resuelve los participantes contra el plantel y omite a quien ya no existe", async () => {
    ({ backend, state } = createMockBackend({
      // El plantel solo conoce a Ana; el partido registró además a Beto.
      players: [ANA],
      history: [
        {
          match: makeMatch({ id: 1n, date: "2026-09-12", maxPlayers: 12n }),
          result: {
            matchId: 1n,
            teamA: [1n],
            teamB: [2n],
            goalsTeamA: 1n,
            goalsTeamB: 0n,
            recordedAt: 0n,
          },
          players: [1n, 2n],
        },
      ],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/historial" });

    const card = await screen.findByTestId("history.item.1");
    // Ana se resuelve contra el plantel; Beto ya no está y no se lista.
    expect(within(card).getByText("Ana Gómez (La Gome)")).toBeInTheDocument();
    expect(within(card).queryByText("Beto Ruiz")).not.toBeInTheDocument();
    expect(within(card).getByText("1 de 12 confirmados")).toBeInTheDocument();
  });
});
