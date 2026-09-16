import { PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Carril PocketIC: ejercita el canister real, no un mock.
 *
 * El cambio aceptado relaja el registro de resultados en el cliente: el
 * organizador puede guardar el marcador y los equipos sin depender de que
 * existan jugadores confirmados. El backend nunca exigió confirmados, así que
 * esta prueba fija contra el wasm real las lecturas públicas que el historial
 * y el panel de resultado consumen, y la puerta de autorización de
 * `recordResult`.
 *
 * El llamador que instala no queda como organizador: el rol admin se otorga
 * solo al completar el flujo de Internet Identity, que este carril no puede
 * reproducir. Por eso aquí no se registra un resultado real; la forma exacta
 * de la llamada `recordResult` la cubre la suite de frontend con el actor
 * tipado.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Solo en un proyecto convertido: la última revisión pre-EM, desde cuya
// estructura se reproduce la cadena de migraciones de esta app.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor } = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM,
    }));
    return;
  }
  // `[baseline, current]`, el mismo contrato que usa el despliegue alojado.
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BASELINE_WASM,
  });
  await pic.upgradeCanister({
    canisterId: installed.canisterId,
    wasm: BACKEND_WASM,
    arg: new Uint8Array(),
  });
  actor = installed.actor;
});

afterAll(async () => {
  await pic?.tearDown();
});

it("devuelve vacío al leer el resultado de un partido inexistente", async () => {
  await expect(actor.getResult(999n)).resolves.toEqual([]);
});

it("devuelve vacío al leer el resumen de un partido inexistente", async () => {
  await expect(actor.getAttendanceSummary(999n)).resolves.toEqual([]);
});

it("arranca con el historial vacío", async () => {
  await expect(actor.listHistory()).resolves.toEqual([]);
});

it("rechaza registrar un resultado a un llamador sin rol de organizador", async () => {
  await expect(
    actor.recordResult(1n, {
      teamA: [1n],
      teamB: [2n],
      goalsTeamA: 1n,
      goalsTeamB: 0n,
    }),
  ).rejects.toThrow(/Unauthorized/);
});
