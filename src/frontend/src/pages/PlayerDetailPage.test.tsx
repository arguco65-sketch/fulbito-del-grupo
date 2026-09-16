import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AttendanceStatus } from "@/backend";
import {
  type MockBackend,
  type MockBackendState,
  createMockBackend,
  installCoreInfrastructureMock,
  makeMatch,
  makePlayer,
  renderApp,
} from "@/test/harness";

let backend: MockBackend;
let state: MockBackendState;

describe("Ficha del integrante", () => {
  it("muestra los datos de contacto y la posición habitual", async () => {
    ({ backend, state } = createMockBackend({
      players: [
        makePlayer({
          id: 1n,
          name: "Ana Gómez",
          nickname: "La Gome",
          position: "delantero",
          phone: "+51 987 654 321",
        }),
      ],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/plantel/1" });

    expect(
      await screen.findByRole("heading", { name: "Ana Gómez" }),
    ).toBeInTheDocument();
    expect(screen.getByText("«La Gome»")).toBeInTheDocument();
    expect(screen.getByText("Delantero")).toBeInTheDocument();

    const phone = screen.getByRole("link", { name: /\+51 987 654 321/ });
    expect(phone).toHaveAttribute("href", "tel:+51987654321");
  });

  it("indica cuando no hay teléfono registrado", async () => {
    ({ backend, state } = createMockBackend({
      players: [makePlayer({ id: 1n, name: "Beto Ruiz", phone: "" })],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/plantel/1" });

    expect(
      await screen.findByText("Sin teléfono registrado"),
    ).toBeInTheDocument();
  });

  it("muestra el historial de asistencia con el estado de cada partido", async () => {
    ({ backend, state } = createMockBackend({
      players: [makePlayer({ id: 1n, name: "Ana Gómez" })],
      allMatches: [
        makeMatch({ id: 10n, date: "2026-09-12", time: "20:00" }),
        makeMatch({ id: 11n, date: "2026-09-19", time: "21:00" }),
      ],
      attendanceByPlayer: new Map([
        [
          "1",
          [
            {
              matchId: 10n,
              playerId: 1n,
              status: AttendanceStatus.confirmed,
              updatedAt: 0n,
            },
            {
              matchId: 11n,
              playerId: 1n,
              status: AttendanceStatus.declined,
              updatedAt: 0n,
            },
          ],
        ],
      ]),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/plantel/1" });

    expect(
      await screen.findByRole("heading", { name: "Historial de asistencia" }),
    ).toBeInTheDocument();

    expect(await screen.findByText("Confirmó")).toBeInTheDocument();
    expect(screen.getByText("No asistió")).toBeInTheDocument();
    expect(screen.getByText(/12 de septiembre de 2026/)).toBeInTheDocument();
    expect(screen.getByText(/19 de septiembre de 2026/)).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay respuestas registradas", async () => {
    ({ backend, state } = createMockBackend({
      players: [makePlayer({ id: 1n, name: "Ana Gómez" })],
      attendanceByPlayer: new Map(),
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/plantel/1" });

    expect(
      await screen.findByText("Todavía no hay respuestas registradas"),
    ).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando el integrante no existe", async () => {
    ({ backend, state } = createMockBackend({ players: [] }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/plantel/99" });

    expect(
      await screen.findByText("No encontramos a este integrante"),
    ).toBeInTheDocument();
  });

  it("permite al organizador editar los datos desde la ficha", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      players: [
        makePlayer({
          id: 1n,
          name: "Ana Gómez",
          nickname: "La Gome",
          position: "delantero",
          phone: "+51 111",
        }),
      ],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp({ initialPath: "/plantel/1" });

    await user.click(
      await screen.findByRole("button", { name: "Editar datos" }),
    );

    const phoneInput = screen.getByLabelText("Teléfono de contacto");
    await user.clear(phoneInput);
    await user.type(phoneInput, "+51 222");

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(backend.updatePlayer).toHaveBeenCalledWith(1n, {
        name: "Ana Gómez",
        nickname: "La Gome",
        position: "delantero",
        phone: "+51 222",
      });
    });
  });

  it("no ofrece editar los datos a un jugador", async () => {
    ({ backend, state } = createMockBackend({
      players: [makePlayer({ id: 1n, name: "Ana Gómez" })],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "user";

    renderApp({ initialPath: "/plantel/1" });

    await screen.findByRole("heading", { name: "Ana Gómez" });

    expect(
      screen.queryByRole("button", { name: "Editar datos" }),
    ).not.toBeInTheDocument();
  });
});
