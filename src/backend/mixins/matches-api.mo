import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import MatchTypes "../types/matches";
import MatchLib "../lib/matches";

mixin (
  accessControlState : AccessControl.AccessControlState,
  matches : Map.Map<Nat, MatchTypes.Match>,
  nextMatchId : { var value : Nat },
) {
  /// Lists upcoming matches ordered by date.
  public query func listUpcomingMatches() : async [MatchTypes.MatchView] {
    MatchLib.listUpcomingMatches(matches);
  };

  /// Lists every match, including cancelled ones.
  public query func listAllMatches() : async [MatchTypes.MatchView] {
    MatchLib.listAllMatches(matches);
  };

  /// Returns one match by id.
  public query func getMatch(id : Nat) : async ?MatchTypes.MatchView {
    MatchLib.getMatch(matches, id);
  };

  /// Creates a match. Organizer only.
  public shared ({ caller }) func createMatch(input : MatchTypes.MatchInput) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only organizers can manage matches");
    };
    MatchLib.createMatch(matches, nextMatchId, input);
  };

  /// Updates a match. Organizer only.
  public shared ({ caller }) func updateMatch(id : Nat, input : MatchTypes.MatchInput) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only organizers can manage matches");
    };
    MatchLib.updateMatch(matches, id, input);
  };

  /// Cancels a match. Organizer only.
  public shared ({ caller }) func cancelMatch(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only organizers can manage matches");
    };
    MatchLib.cancelMatch(matches, id);
  };
};
