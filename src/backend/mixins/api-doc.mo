mixin () {
  /// Returns the backend API documentation as static Markdown.
  public query func getApiDoc() : async Text {
    let doc = "\23 API del backend — Gestión de partidos y asistencia

## Propósito

Este canister gestiona la plantilla de jugadores, la programación de partidos,
la asistencia de cada jugador y los resultados de los partidos jugados. Toda la
interfaz está en español.

## Autenticación

- Las consultas (`query`) son públicas y no requieren sesión.
- Las mutaciones (`recordResult`, `createMatch`, `updateMatch`, `cancelMatch`,
  `createPlayer`, `updatePlayer`, `deletePlayer`, `setAttendance`) requieren un
  llamador firmado (no anónimo) y registrado en el control de acceso.
- El frontend fija un *derivation origin* de Internet Identity. Un agente que ya
  tenga la autorización del usuario deriva el principal correcto contra ese
  origen (por ejemplo `icp identity link web <nombre> --app <host>`). Esa
  delegación actúa con toda la autoridad del usuario en esta app hasta que
  caduque.

## Autorización

- El **organizador** es el rol `admin`. El primer usuario que entra queda como
  organizador; los siguientes quedan como usuarios normales.
- Solo el organizador puede crear, editar y cancelar partidos, gestionar la
  plantilla y registrar resultados.
- Cualquier usuario registrado puede confirmar o rechazar su asistencia.
- Un llamador no registrado o anónimo recibe un trap: `Unauthorized: Only
  organizers can ...` en los endpoints de organizador, o `Unauthorized: Sign in
  to confirm your attendance` en `setAttendance`.
- El registro ocurre solo al iniciar sesión desde el frontend de la app; un
  principal que nunca lo hizo está sin registrar aunque pertenezca al dueño, y
  un principal derivado contra otro origen es distinto del registrado.

## Unidades y codificación

- `Timestamp` es `Int`: nanosegundos desde la época (`Time.now()`).
- `date` es `Text` en formato `YYYY-MM-DD` y `time` es `Text` en formato
  `HH:MM`; ambos son ordenables lexicográficamente.
- `PlayerId` y `MatchId` son `Nat`.
- `AttendanceStatus` es la variante `{ #confirmed; #declined }`.
- La asistencia se almacena como `Map<MatchId, Map<PlayerId, Attendance>>`.
- `AttendanceSummary` tiene los campos `confirmed`, `declined` y `pending`
  (todos `[ConfirmedPlayer]`), más `spotsLeft`. `pending` son los jugadores del
  plantel que aún no respondieron para ese partido; `confirmed` y `declined` son
  los que ya respondieron.
- `spotsLeft` se deriva de `maxPlayers` menos el número de confirmados (nunca
  negativo).

## Ciclo de vida y polling

- `listUpcomingMatches()` devuelve los partidos no cancelados con fecha igual o
  posterior a hoy.
- `listHistory()` devuelve los partidos **pasados** (fecha anterior a hoy) no
  cancelados, con su resultado (puede ser `null`) y la lista de participantes.
  Los participantes se derivan de la asistencia confirmada y, cuando existe
  resultado, se unen con `teamA`/`teamB` sin duplicados.
- `getAttendanceSummary(matchId)` es la fuente para el polling en vivo de la
  lista de confirmados, los jugadores pendientes de responder y los cupos
  disponibles; devuelve `null` si el partido no existe.
- `getResult(matchId)` devuelve `null` mientras no se haya registrado resultado.

## Seguridad de reintento de mutaciones

- `setAttendance` es idempotente: repetir la misma llamada deja el mismo estado.
- `recordResult` sobrescribe el resultado previo del partido (última escritura
  gana); repetirlo con los mismos datos no cambia el estado.
- `createPlayer` y `createMatch` **no** son idempotentes: cada llamada crea un
  registro nuevo con un id nuevo. No reintentar a ciegas.
- `updatePlayer`, `updateMatch`, `cancelMatch` y `deletePlayer` son idempotentes
  en el sentido de que repetirlos deja el mismo estado final.
- `cancelMatch` es destructivo para la programación: el partido deja de
  aparecer en próximos e historial.

## Errores y límites

- Los errores de autorización y de validación se reportan como traps con
  mensajes en español (`Match not found`, `Player not found`, `Match is
  cancelled`, `Match is full`, `Unauthorized: ...`).
- `setAttendance` rechaza confirmar cuando `spotsLeft` es 0 (`Match is full`),
  pero permite cambiar de confirmado a rechazado.
- No se puede registrar asistencia en un partido cancelado.

## Particularidades

- Las fechas y horas se guardan como `Text` ordenable, no como timestamps.
- El historial solo incluye partidos con fecha estrictamente anterior a hoy.
- `getApiDoc()` devuelve este documento de forma estática.
";
    doc;
  };
};
