import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import ResultTypes "../types/results";
import AttendanceTypes "../types/attendance";
import MatchTypes "../types/matches";
import ResultLib "../lib/results";

mixin (
  accessControlState : AccessControl.AccessControlState,
  results : Map.Map<Nat, ResultTypes.MatchResult>,
  matches : Map.Map<Nat, MatchTypes.Match>,
  attendance : Map.Map<Nat, Map.Map<Nat, AttendanceTypes.Attendance>>,
) {
  /// Records the final result and line-ups of a played match. Organizer only.
  public shared ({ caller }) func recordResult(matchId : Nat, input : ResultTypes.MatchResultInput) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only organizers can record results");
    };
    switch (matches.get(matchId)) {
      case null { Runtime.trap("Match not found") };
      case (?_) {
        ResultLib.recordResult(results, matchId, input);
      };
    };
  };

  /// Returns the recorded result of a match.
  public query func getResult(matchId : Nat) : async ?ResultTypes.MatchResultView {
    ResultLib.getResult(results, matchId);
  };

  /// Returns past matches with their result and participants.
  public query func listHistory() : async [ResultTypes.MatchHistoryEntry] {
    ResultLib.listHistory(results, matches, attendance);
  };
};
