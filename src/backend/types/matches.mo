import Common "common";

module {
  /// A scheduled match.
  public type Match = {
    id : Common.MatchId;
    date : Text;
    time : Text;
    place : Text;
    maxPlayers : Nat;
    cancelled : Bool;
    createdAt : Common.Timestamp;
  };

  /// Shared view of a match returned by the public API.
  public type MatchView = {
    id : Common.MatchId;
    date : Text;
    time : Text;
    place : Text;
    maxPlayers : Nat;
    cancelled : Bool;
    createdAt : Common.Timestamp;
  };

  /// Input payload for creating or updating a match.
  public type MatchInput = {
    date : Text;
    time : Text;
    place : Text;
    maxPlayers : Nat;
  };

  /// Errors a match mutation can report to the caller.
  public type MatchError = {
    #notAuthorized;
    #notFound : Common.MatchId;
    #invalidInput : Text;
  };
};
