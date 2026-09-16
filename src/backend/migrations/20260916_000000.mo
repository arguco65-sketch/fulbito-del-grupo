import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type Player = {
    id : Nat;
    name : Text;
    nickname : Text;
    position : Text;
    phone : Text;
    createdAt : Int;
  };

  type Match = {
    id : Nat;
    date : Text;
    time : Text;
    place : Text;
    maxPlayers : Nat;
    cancelled : Bool;
    createdAt : Int;
  };

  type AttendanceStatus = {
    #confirmed;
    #declined;
  };

  type Attendance = {
    matchId : Nat;
    playerId : Nat;
    status : AttendanceStatus;
    updatedAt : Int;
  };

  type MatchResult = {
    matchId : Nat;
    goalsTeamA : Nat;
    goalsTeamB : Nat;
    teamA : [Nat];
    teamB : [Nat];
    recordedAt : Int;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    players : Map.Map<Nat, Player>;
    nextPlayerId : { var value : Nat };
    matches : Map.Map<Nat, Match>;
    nextMatchId : { var value : Nat };
    attendance : Map.Map<Nat, Map.Map<Nat, Attendance>>;
    results : Map.Map<Nat, MatchResult>;
  };

  public func migration(_old : {}) : NewActor {
    {
      accessControlState = AccessControl.initState();
      players = Map.empty();
      nextPlayerId = { var value = 1 };
      matches = Map.empty();
      nextMatchId = { var value = 1 };
      attendance = Map.empty();
      results = Map.empty();
    };
  };
};
