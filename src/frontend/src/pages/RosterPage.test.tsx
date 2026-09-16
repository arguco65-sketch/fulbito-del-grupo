import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  type MockBackend,
  type MockBackendState,
  createMockBackend,
  installCoreInfrastructureMock,
  makePlayer,
  renderApp,
} from "@/test/harness";

let backend: MockBackend;
let state: MockBackendState;

describe("Plantel", () => {
  it("lista a los integrantes con su apodo, posición y teléfono", async () => {
    ({ backend, state } = createMockBackend({
      players: [
        makePlayer({
          id: 1n,
          name: "Ana Gómez",
          nickname: "La Gome",
          position: "delantero",
          phone: "+51 987 654 321",
        }),
        makePlayer({
          id: 2n,
          name: "Beto Ruiz",
          nickname: "",
          position: "portero",
          phone: "",
        }),
      ],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/plantel" });

    expect(
      await screen.findByRole("heading", { name: "Plantel" }),
    ).toBeInTheDocument();

    const items = await screen.findAllByRole("article");
    expect(items).toHaveLength(2);

    expect(screen.getByText("Ana Gómez")).toBeInTheDocument();
    expect(screen.getByText("«La Gome»")).toBeInTheDocument();
    expect(screen.getByText("Delantero")).toBeInTheDocument();
    expect(screen.getByText("+51 987 654 321")).toBeInTheDocument();

    expect(screen.getByText("Beto Ruiz")).toBeInTheDocument();
    expect(screen.getByText("Sin apodo")).toBeInTheDocument();
    expect(screen.getByText("Portero")).toBeInTheDocument();
    expect(screen.getByText("Sin teléfono de contacto")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay integrantes", async () => {
    ({ backend, state } = createMockBackend({ players: [] }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/plantel" });

    expect(
      await screen.findByText("El plantel está vacío"),
    ).toBeInTheDocument();
  });

  it("busca por nombre o apodo y muestra el resumen de resultados", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      players: [
        makePlayer({ id: 1n, name: "Ana Gómez", nickname: "La Gome" }),
        makePlayer({ id: 2n, name: "Beto Ruiz", nickname: "El Beto" }),
      ],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/plantel" });

    await screen.findAllByRole("article");

    await user.type(screen.getByLabelText("Buscar por nombre o apodo"), "beto");

    await waitFor(() => {
      expect(backend.searchPlayers).toHaveBeenCalledWith("beto");
    });

    expect(
      await screen.findByText("1 resultado para «beto»"),
    ).toBeInTheDocument();
    expect(screen.getByText("Beto Ruiz")).toBeInTheDocument();
    expect(screen.queryByText("Ana Gómez")).not.toBeInTheDocument();
  });

  it("muestra el estado vacío de búsqueda y permite volver al plantel completo", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      players: [makePlayer({ id: 1n, name: "Ana Gómez" })],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/plantel" });

    await screen.findAllByRole("article");

    await user.type(screen.getByLabelText("Buscar por nombre o apodo"), "zzz");

    expect(
      await screen.findByText("No encontramos a nadie con ese nombre"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Ver todo el plantel" }),
    );

    expect(await screen.findByText("Ana Gómez")).toBeInTheDocument();
  });

  it("no ofrece agregar, editar ni dar de baja a un jugador", async () => {
    ({ backend, state } = createMockBackend({
      players: [makePlayer({ id: 1n, name: "Ana Gómez" })],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "user";

    renderApp({ initialPath: "/plantel" });

    await screen.findAllByRole("article");

    expect(
      screen.queryByRole("button", { name: /agregar integrante/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^editar$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /dar de baja/i }),
    ).not.toBeInTheDocument();
  });

  it("permite al organizador dar de alta un integrante", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({ players: [] }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp({ initialPath: "/plantel" });

    // Con el plantel vacío hay dos accesos al mismo formulario: el del
    // encabezado y el del estado vacío. Cualquiera abre el diálogo.
    const [openButton] = await screen.findAllByRole("button", {
      name: /agregar integrante/i,
    });
    await user.click(openButton);

    await user.type(screen.getByLabelText("Nombre y apellido"), "Carla Díaz");
    await user.type(screen.getByLabelText("Apodo"), "La Flaca");
    await user.type(
      screen.getByLabelText("Teléfono de contacto"),
      "+51 900 000 000",
    );

    await user.click(
      screen.getByRole("button", { name: "Agregar al plantel" }),
    );

    await waitFor(() => {
      expect(backend.createPlayer).toHaveBeenCalledWith({
        name: "Carla Díaz",
        nickname: "La Flaca",
        position: "mediocampista",
        phone: "+51 900 000 000",
      });
    });
  });

  it("no envía al backend un integrante sin nombre", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({ players: [] }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp({ initialPath: "/plantel" });

    const [openButton] = await screen.findAllByRole("button", {
      name: /agregar integrante/i,
    });
    await user.click(openButton);

    await user.click(
      screen.getByRole("button", { name: "Agregar al plantel" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Escribe el nombre del integrante.",
    );
    expect(backend.createPlayer).not.toHaveBeenCalled();
  });

  it("permite al organizador editar un integrante existente", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      players: [
        makePlayer({
          id: 7n,
          name: "Ana Gómez",
          nickname: "La Gome",
          position: "delantero",
          phone: "+51 111",
        }),
      ],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp({ initialPath: "/plantel" });

    await screen.findAllByRole("article");

    await user.click(screen.getByRole("button", { name: /^editar$/i }));

    const nameInput = screen.getByLabelText("Nombre y apellido");
    await user.clear(nameInput);
    await user.type(nameInput, "Ana María Gómez");

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(backend.updatePlayer).toHaveBeenCalledWith(7n, {
        name: "Ana María Gómez",
        nickname: "La Gome",
        position: "delantero",
        phone: "+51 111",
      });
    });
  });

  it("permite al organizador dar de baja a un integrante tras confirmar", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      players: [makePlayer({ id: 3n, name: "Beto Ruiz" })],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: true });
    state.role = "admin";

    renderApp({ initialPath: "/plantel" });

    await screen.findAllByRole("article");

    await user.click(screen.getByRole("button", { name: /dar de baja/i }));

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(/¿Dar de baja a Beto Ruiz\?/),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "Sí, dar de baja" }),
    );

    await waitFor(() => {
      expect(backend.deletePlayer).toHaveBeenCalledWith(3n);
    });
  });

  it("abre la ficha de detalle desde la tarjeta del integrante", async () => {
    const user = userEvent.setup();
    ({ backend, state } = createMockBackend({
      players: [
        makePlayer({
          id: 5n,
          name: "Ana Gómez",
          nickname: "La Gome",
          position: "delantero",
          phone: "+51 987 654 321",
        }),
      ],
    }));
    installCoreInfrastructureMock({ backend, isAuthenticated: false });

    renderApp({ initialPath: "/plantel" });

    await screen.findAllByRole("article");

    await user.click(screen.getByRole("link", { name: "Ver ficha" }));

    expect(
      await screen.findByRole("heading", { name: "Ana Gómez" }),
    ).toBeInTheDocument();
    expect(screen.getByText("«La Gome»")).toBeInTheDocument();
    expect(screen.getByText("Delantero")).toBeInTheDocument();
  });
});
