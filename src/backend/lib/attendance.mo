import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Time "mo:core/Time";
import Types "../types/attendance";
import RosterTypes "../types/roster";
import MatchTypes "../types/matches";

module {
  /// Records a player's attendance answer for a match.
  public func setAttendance(
    attendance : Map.Map<Nat, Map.Map<Nat, Types.Attendance>>,
    matchId : Nat,
    playerId : Nat,
    confirmed : Bool,
  ) : () {
    let byPlayer = switch (attendance.get(matchId)) {
      case (?m) { m };
      case null {
        let m = Map.empty<Nat, Types.Attendance>();
        attendance.add(matchId, m);
        m;
      };
    };
    byPlayer.add(playerId, {
      matchId;
      playerId;
      status = if (confirmed) { #confirmed } else { #declined };
      updatedAt = Time.now();
    });
  };

  /// Returns the live attendance summary for a match.
  public func getAttendanceSummary(
    attendance : Map.Map<Nat, Map.Map<Nat, Types.Attendance>>,
    matches : Map.Map<Nat, MatchTypes.Match>,
    players : Map.Map<Nat, RosterTypes.Player>,
    matchId : Nat,
  ) : ?Types.AttendanceSummary {
    switch (matches.get(matchId)) {
      case null { null };
      case (?m) {
        let confirmed = List.empty<Types.ConfirmedPlayer>();
        let declined = List.empty<Types.ConfirmedPlayer>();
        let answered = List.empty<Nat>();
        switch (attendance.get(matchId)) {
          case (?byPlayer) {
            for (a in byPlayer.values()) {
              switch (players.get(a.playerId)) {
                case (?p) {
                  let entry = {
                    playerId = p.id;
                    name = p.name;
                    nickname = p.nickname;
                    position = p.position;
                  };
                  answered.add(p.id);
                  switch (a.status) {
                    case (#confirmed) { confirmed.add(entry) };
                    case (#declined) { declined.add(entry) };
                  };
                };
                case null {};
              };
            };
          };
          case null {};
        };
        let pending = List.empty<Types.ConfirmedPlayer>();
        for (p in players.values()) {
          if (not answered.contains(p.id)) {
            pending.add({
              playerId = p.id;
              name = p.name;
              nickname = p.nickname;
              position = p.position;
            });
          };
        };
        let confirmedArray = confirmed.toArray();
        let confirmedCount = confirmedArray.size();
        var spotsLeft = 0;
        if (confirmedCount < m.maxPlayers) {
          spotsLeft := m.maxPlayers - confirmedCount;
        };
        ?{
          matchId;
          confirmed = confirmedArray;
          declined = declined.toArray();
          pending = pending.toArray();
          spotsLeft;
        };
      };
    };
  };

  /// Returns the attendance history of one player.
  public func getPlayerAttendance(
    attendance : Map.Map<Nat, Map.Map<Nat, Types.Attendance>>,
    playerId : Nat,
  ) : [Types.AttendanceView] {
    let result = List.empty<Types.AttendanceView>();
    for ((matchId, byPlayer) in attendance.entries()) {
      switch (byPlayer.get(playerId)) {
        case (?a) {
          result.add({
            matchId = a.matchId;
            playerId = a.playerId;
            status = a.status;
            updatedAt = a.updatedAt;
          });
        };
        case null {};
      };
    };
    result.toArray();
  };
};
