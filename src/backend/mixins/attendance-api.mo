import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import AttendanceTypes "../types/attendance";
import RosterTypes "../types/roster";
import MatchTypes "../types/matches";
import AttendanceLib "../lib/attendance";

mixin (
  accessControlState : AccessControl.AccessControlState,
  attendance : Map.Map<Nat, Map.Map<Nat, AttendanceTypes.Attendance>>,
  matches : Map.Map<Nat, MatchTypes.Match>,
  players : Map.Map<Nat, RosterTypes.Player>,
) {
  /// Confirms or declines the caller's attendance to a match.
  public shared ({ caller }) func setAttendance(matchId : Nat, playerId : Nat, confirmed : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Sign in to confirm your attendance");
    };
    switch (matches.get(matchId)) {
      case null { Runtime.trap("Match not found") };
      case (?m) {
        if (m.cancelled) {
          Runtime.trap("Match is cancelled");
        };
        if (players.get(playerId) == null) {
          Runtime.trap("Player not found");
        };
        if (confirmed) {
          let alreadyConfirmed = switch (attendance.get(matchId)) {
            case (?byPlayer) {
              switch (byPlayer.get(playerId)) {
                case (?a) { a.status == #confirmed };
                case null { false };
              };
            };
            case null { false };
          };
          if (not alreadyConfirmed) {
            switch (AttendanceLib.getAttendanceSummary(attendance, matches, players, matchId)) {
              case (?summary) {
                if (summary.spotsLeft == 0) {
                  Runtime.trap("Match is full");
                };
              };
              case null {};
            };
          };
        };
        AttendanceLib.setAttendance(attendance, matchId, playerId, confirmed);
      };
    };
  };

  /// Returns the live attendance summary for a match.
  public query func getAttendanceSummary(matchId : Nat) : async ?AttendanceTypes.AttendanceSummary {
    AttendanceLib.getAttendanceSummary(attendance, matches, players, matchId);
  };

  /// Returns the attendance history of one player.
  public query func getPlayerAttendance(playerId : Nat) : async [AttendanceTypes.AttendanceView] {
    AttendanceLib.getPlayerAttendance(attendance, playerId);
  };
};
