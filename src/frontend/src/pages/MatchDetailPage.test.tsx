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

describe("Detalle del partido", () => {
  it("muestra los datos del partido y la lista de confirmados", async () => {
    ({ backend, state } = createMockBackend({
      allMatches: [
        makeMatch({
          id: 1n,
          date: "2026-10-10",
          time: "20:00",
          place: "Cancha 1",
          maxPlayers: 12n,
        }),
      ],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            confirmed: [
              {
                playerId: 1n,
                name: "Ana Gómez",
                nickname: "La Gome",
                position: "delantero",
              },
            ],
            spotsLeft: 11n,
          }),
        ],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/partidos/1" });

    expect(
      await screen.findByRole("heading", { name: /10 de octubre de 2026/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cancha 1")).toBeInTheDocument();
    expect(screen.getByText("20:00")).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: "Confirmados (1)" }),
    ).toBeInTheDocument();
    const confirmedList = screen.getByTestId("attendance.confirmed_list");
    expect(
      within(confirmedList).getByText("Ana Gómez (La Gome)"),
    ).toBeInTheDocument();
    // El contador aparece tanto en el encabezado como en el panel.
    expect(screen.getAllByText("Quedan 11 cupos").length).toBeGreaterThan(0);
  });

  it("permite a un jugador confirmar su asistencia y actualiza los cupos", async () => {
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
            declined: [],
            pending: [
              {
                playerId: 1n,
                name: "Ana Gómez",
                nickname: "La Gome",
                position: "delantero",
              },
              {
                playerId: 2n,
                name: "Beto Ruiz",
                nickname: "",
                position: "portero",
              },
            ],
            spotsLeft: 12n,
          }),
        ],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "user";

    renderApp({ initialPath: "/partidos/1" });

    // El jugador elige quién es antes de poder responder.
    await user.selectOptions(
      await screen.findByLabelText("Tu nombre en el plantel"),
      "1",
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Confirmar mi asistencia",
      }),
    );

    await waitFor(() => {
      expect(backend.setAttendance).toHaveBeenCalledWith(1n, 1n, true);
    });
  });

  it("permite a un jugador rechazar su asistencia", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n, maxPlayers: 12n })],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            pending: [
              {
                playerId: 1n,
                name: "Ana Gómez",
                nickname: "La Gome",
                position: "delantero",
              },
              {
                playerId: 2n,
                name: "Beto Ruiz",
                nickname: "",
                position: "portero",
              },
            ],
            spotsLeft: 12n,
          }),
        ],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "user";

    renderApp({ initialPath: "/partidos/1" });

    await user.selectOptions(
      await screen.findByLabelText("Tu nombre en el plantel"),
      "2",
    );

    await user.click(
      await screen.findByRole("button", { name: "No puedo asistir" }),
    );

    await waitFor(() => {
      expect(backend.setAttendance).toHaveBeenCalledWith(1n, 2n, false);
    });
  });

  it("refleja el contador de cupos del resumen y lo actualiza al confirmar", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n, maxPlayers: 12n })],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            pending: [
              {
                playerId: 1n,
                name: "Ana Gómez",
                nickname: "La Gome",
                position: "delantero",
              },
              {
                playerId: 2n,
                name: "Beto Ruiz",
                nickname: "",
                position: "portero",
              },
            ],
            spotsLeft: 12n,
          }),
        ],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "user";

    renderApp({ initialPath: "/partidos/1" });

    expect(
      (await screen.findAllByText("Quedan 12 cupos")).length,
    ).toBeGreaterThan(0);

    // El backend devuelve el resumen actualizado tras confirmar.
    backend.setAttendance.mockImplementation(async () => {
      state.summaries.set(
        "1",
        makeSummary({
          matchId: 1n,
          confirmed: [
            {
              playerId: 1n,
              name: "Ana Gómez",
              nickname: "La Gome",
              position: "delantero",
            },
          ],
          pending: [
            {
              playerId: 2n,
              name: "Beto Ruiz",
              nickname: "",
              position: "portero",
            },
          ],
          spotsLeft: 11n,
        }),
      );
    });

    await user.selectOptions(
      await screen.findByLabelText("Tu nombre en el plantel"),
      "1",
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Confirmar mi asistencia",
      }),
    );

    expect(
      (await screen.findAllByText("Quedan 11 cupos")).length,
    ).toBeGreaterThan(0);
    expect(
      await screen.findByRole("heading", { name: "Confirmados (1)" }),
    ).toBeInTheDocument();
  });

  it("permite al organizador cancelar el partido tras confirmar", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n })],
      players: [ANA],
      summaries: new Map([["1", makeSummary({ matchId: 1n })]]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp({ initialPath: "/partidos/1" });

    await user.click(
      await screen.findByRole("button", { name: "Cancelar partido" }),
    );

    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Sí, cancelar" }),
    );

    await waitFor(() => {
      expect(backend.cancelMatch).toHaveBeenCalledWith(1n);
    });
  });

  it("muestra el estado no encontrado para un id inválido", async () => {
    ({ backend, state } = createMockBackend({}));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/partidos/abc" });

    expect(
      await screen.findByText("Partido no encontrado"),
    ).toBeInTheDocument();
  });
});

describe("Registro del resultado", () => {
  it("permite al organizador registrar goles y equipos", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n, maxPlayers: 12n })],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            confirmed: [
              {
                playerId: 1n,
                name: "Ana Gómez",
                nickname: "La Gome",
                position: "delantero",
              },
              {
                playerId: 2n,
                name: "Beto Ruiz",
                nickname: "",
                position: "portero",
              },
            ],
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
    await user.type(within(dialog).getByLabelText("Goles del Equipo A"), "3");
    await user.clear(within(dialog).getByLabelText("Goles del Equipo B"));
    await user.type(within(dialog).getByLabelText("Goles del Equipo B"), "2");
    // Cada confirmado tiene su propio par de botones; se asigna por jugador.
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
        goalsTeamA: 3n,
        goalsTeamB: 2n,
      });
    });
  });

  it("permite guardar el resultado aunque solo un equipo tenga jugadores", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n })],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            confirmed: [
              {
                playerId: 1n,
                name: "Ana Gómez",
                nickname: "La Gome",
                position: "delantero",
              },
              {
                playerId: 2n,
                name: "Beto Ruiz",
                nickname: "",
                position: "portero",
              },
            ],
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
    // Solo se asigna un equipo: el rival queda vacío y aun así se guarda.
    await user.click(
      within(
        within(dialog).getByRole("group", { name: "Equipo de Ana Gómez" }),
      ).getByRole("button", { name: "Equipo A" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Guardar resultado" }),
    );

    await waitFor(() => {
      expect(backend.recordResult).toHaveBeenCalledWith(1n, {
        teamA: [1n],
        teamB: [],
        goalsTeamA: 0n,
        goalsTeamB: 0n,
      });
    });
  });

  it("muestra el resultado registrado con el marcador y los equipos", async () => {
    ({ backend, state } = createMockBackend({
      allMatches: [makeMatch({ id: 1n })],
      players: [ANA, BETO],
      summaries: new Map([
        [
          "1",
          makeSummary({
            matchId: 1n,
            confirmed: [
              {
                playerId: 1n,
                name: "Ana Gómez",
                nickname: "La Gome",
                position: "delantero",
              },
              {
                playerId: 2n,
                name: "Beto Ruiz",
                nickname: "",
                position: "portero",
              },
            ],
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
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/partidos/1" });

    expect(
      await screen.findByRole("heading", { name: "Resultado final" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 - 2")).toBeInTheDocument();

    const panel = screen.getByTestId("match_detail.result_panel");
    expect(within(panel).getByText("Ana Gómez (La Gome)")).toBeInTheDocument();
    expect(within(panel).getByText("Beto Ruiz")).toBeInTheDocument();
  });
});
