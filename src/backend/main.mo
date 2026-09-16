import Map "mo:core/Map";
import Nat "mo:core/Nat";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import MapEntity "mo:caffeineai-oql/MapEntity";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import IntValue "mo:caffeineai-oql/IntValue";

import RosterTypes "types/roster";
import MatchTypes "types/matches";
import AttendanceTypes "types/attendance";
import ResultTypes "types/results";

import RosterApi "mixins/roster-api";
import MatchesApi "mixins/matches-api";
import AttendanceApi "mixins/attendance-api";
import ResultsApi "mixins/results-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let players : Map.Map<Nat, RosterTypes.Player>;
  let nextPlayerId : { var value : Nat };
  let matches : Map.Map<Nat, MatchTypes.Match>;
  let nextMatchId : { var value : Nat };
  let attendance : Map.Map<Nat, Map.Map<Nat, AttendanceTypes.Attendance>>;
  let results : Map.Map<Nat, ResultTypes.MatchResult>;

  include MixinAuthorization(accessControlState, null);

  include RosterApi(accessControlState, players, nextPlayerId);
  include MatchesApi(accessControlState, matches, nextMatchId);
  include AttendanceApi(accessControlState, attendance, matches, players);
  include ResultsApi(accessControlState, results, matches, attendance);

  include ApiDocMixin();

  include Expose({
    entities = [
      players.toEntity("player", "Player", "id")
        .sample({ id = 0; name = ""; nickname = ""; position = ""; phone = ""; createdAt = 0 })
        .controllerOnly()
        .build(),
      matches.toEntity("match", "Match", "id")
        .sample({ id = 0; date = ""; time = ""; place = ""; maxPlayers = 0; cancelled = false; createdAt = 0 })
        .controllerOnly()
        .build(),
      results.toEntityManual("matchResult", "MatchResult", "matchId")
        .sample({ matchId = 0; goalsTeamA = 0; goalsTeamB = 0; teamA = []; teamB = []; recordedAt = 0 })
        .payload("matchId", func r = r.matchId)
        .payload("goalsTeamA", func r = r.goalsTeamA)
        .payload("goalsTeamB", func r = r.goalsTeamB)
        .payload("teamASize", func r = r.teamA.size())
        .payload("teamBSize", func r = r.teamB.size())
        .payload("recordedAt", func r = r.recordedAt)
        .controllerOnly()
        .build(),
    ];
  });
};
