import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import RosterTypes "../types/roster";
import RosterLib "../lib/roster";

mixin (
  accessControlState : AccessControl.AccessControlState,
  players : Map.Map<Nat, RosterTypes.Player>,
  nextPlayerId : { var value : Nat },
) {
  /// Lists every player in the roster.
  public query func listPlayers() : async [RosterTypes.PlayerView] {
    RosterLib.listPlayers(players);
  };

  /// Returns one player by id.
  public query func getPlayer(id : Nat) : async ?RosterTypes.PlayerView {
    RosterLib.getPlayer(players, id);
  };

  /// Searches the roster by name or nickname.
  public query func searchPlayers(term : Text) : async [RosterTypes.PlayerView] {
    RosterLib.searchPlayers(players, term);
  };

  /// Creates a player. Organizer only.
  public shared ({ caller }) func createPlayer(input : RosterTypes.PlayerInput) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only organizers can manage the roster");
    };
    RosterLib.createPlayer(players, nextPlayerId, input);
  };

  /// Updates a player. Organizer only.
  public shared ({ caller }) func updatePlayer(id : Nat, input : RosterTypes.PlayerInput) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only organizers can manage the roster");
    };
    RosterLib.updatePlayer(players, id, input);
  };

  /// Removes a player. Organizer only.
  public shared ({ caller }) func deletePlayer(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only organizers can manage the roster");
    };
    RosterLib.deletePlayer(players, id);
  };
};
