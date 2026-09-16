import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Types "../types/roster";

module {
  /// Returns every player in the roster.
  public func listPlayers(players : Map.Map<Nat, Types.Player>) : [Types.PlayerView] {
    players.values().map(func p = toView(p)).toArray();
  };

  /// Returns one player by id, or null when absent.
  public func getPlayer(players : Map.Map<Nat, Types.Player>, id : Nat) : ?Types.PlayerView {
    switch (players.get(id)) {
      case (?p) { ?toView(p) };
      case null { null };
    };
  };

  /// Searches the roster by name or nickname.
  public func searchPlayers(players : Map.Map<Nat, Types.Player>, term : Text) : [Types.PlayerView] {
    let needle = term.toLower();
    players.values().filter(func p = p.name.toLower().contains(#text needle) or p.nickname.toLower().contains(#text needle)).map(func p = toView(p)).toArray();
  };

  /// Creates a player and returns its new id.
  public func createPlayer(players : Map.Map<Nat, Types.Player>, nextId : { var value : Nat }, input : Types.PlayerInput) : Nat {
    let id = nextId.value;
    nextId.value := id + 1;
    players.add(id, {
      id;
      name = input.name;
      nickname = input.nickname;
      position = input.position;
      phone = input.phone;
      createdAt = Time.now();
    });
    id;
  };

  /// Updates an existing player.
  public func updatePlayer(players : Map.Map<Nat, Types.Player>, id : Nat, input : Types.PlayerInput) : () {
    switch (players.get(id)) {
      case (?p) {
        players.add(id, {
          id = p.id;
          name = input.name;
          nickname = input.nickname;
          position = input.position;
          phone = input.phone;
          createdAt = p.createdAt;
        });
      };
      case null {};
    };
  };

  /// Removes a player from the roster.
  public func deletePlayer(players : Map.Map<Nat, Types.Player>, id : Nat) : () {
    players.remove(id);
  };

  /// Projects a stored player to its shared view.
  public func toView(p : Types.Player) : Types.PlayerView {
    {
      id = p.id;
      name = p.name;
      nickname = p.nickname;
      position = p.position;
      phone = p.phone;
      createdAt = p.createdAt;
    };
  };
};
