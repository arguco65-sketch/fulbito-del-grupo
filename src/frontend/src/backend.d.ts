import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AttendanceSummary {
    pending: Array<ConfirmedPlayer>;
    matchId: MatchId;
    spotsLeft: bigint;
    confirmed: Array<ConfirmedPlayer>;
    declined: Array<ConfirmedPlayer>;
}
export interface AttendanceView {
    status: AttendanceStatus;
    playerId: PlayerId;
    updatedAt: Timestamp;
    matchId: MatchId;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface ConfirmedPlayer {
    nickname: string;
    playerId: PlayerId;
    name: string;
    position: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface MatchHistoryEntry {
    match: MatchView;
    result?: MatchResultView;
    players: Array<PlayerId>;
}
export type MatchId = bigint;
export interface MatchInput {
    date: string;
    time: string;
    place: string;
    maxPlayers: bigint;
}
export interface MatchResultInput {
    teamA: Array<PlayerId>;
    teamB: Array<PlayerId>;
    goalsTeamA: bigint;
    goalsTeamB: bigint;
}
export interface MatchResultView {
    teamA: Array<PlayerId>;
    teamB: Array<PlayerId>;
    recordedAt: Timestamp;
    matchId: MatchId;
    goalsTeamA: bigint;
    goalsTeamB: bigint;
}
export interface MatchView {
    id: MatchId;
    cancelled: boolean;
    date: string;
    createdAt: Timestamp;
    time: string;
    place: string;
    maxPlayers: bigint;
}
export type PlayerId = bigint;
export interface PlayerInput {
    nickname: string;
    name: string;
    phone: string;
    position: string;
}
export interface PlayerView {
    id: PlayerId;
    nickname: string;
    name: string;
    createdAt: Timestamp;
    phone: string;
    position: string;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum AttendanceStatus {
    confirmed = "confirmed",
    declined = "declined"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Cancels a match. Organizer only.
     */
    cancelMatch(id: bigint): Promise<void>;
    /**
     * / Creates a match. Organizer only.
     */
    createMatch(input: MatchInput): Promise<bigint>;
    /**
     * / Creates a player. Organizer only.
     */
    createPlayer(input: PlayerInput): Promise<bigint>;
    /**
     * / Removes a player. Organizer only.
     */
    deletePlayer(id: bigint): Promise<void>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Returns the backend API documentation as static Markdown.
     */
    getApiDoc(): Promise<string>;
    /**
     * / Returns the live attendance summary for a match.
     */
    getAttendanceSummary(matchId: bigint): Promise<AttendanceSummary | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Returns one match by id.
     */
    getMatch(id: bigint): Promise<MatchView | null>;
    /**
     * / Returns one player by id.
     */
    getPlayer(id: bigint): Promise<PlayerView | null>;
    /**
     * / Returns the attendance history of one player.
     */
    getPlayerAttendance(playerId: bigint): Promise<Array<AttendanceView>>;
    /**
     * / Returns the recorded result of a match.
     */
    getResult(matchId: bigint): Promise<MatchResultView | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Lists every match, including cancelled ones.
     */
    listAllMatches(): Promise<Array<MatchView>>;
    /**
     * / Returns past matches with their result and participants.
     */
    listHistory(): Promise<Array<MatchHistoryEntry>>;
    /**
     * / Lists every player in the roster.
     */
    listPlayers(): Promise<Array<PlayerView>>;
    /**
     * / Lists upcoming matches ordered by date.
     */
    listUpcomingMatches(): Promise<Array<MatchView>>;
    /**
     * / Records the final result and line-ups of a played match. Organizer only.
     */
    recordResult(matchId: bigint, input: MatchResultInput): Promise<void>;
    schema(): Promise<string>;
    /**
     * / Searches the roster by name or nickname.
     */
    searchPlayers(term: string): Promise<Array<PlayerView>>;
    /**
     * / Confirms or declines the caller's attendance to a match.
     */
    setAttendance(matchId: bigint, playerId: bigint, confirmed: boolean): Promise<void>;
    /**
     * / Updates a match. Organizer only.
     */
    updateMatch(id: bigint, input: MatchInput): Promise<void>;
    /**
     * / Updates a player. Organizer only.
     */
    updatePlayer(id: bigint, input: PlayerInput): Promise<void>;
}
