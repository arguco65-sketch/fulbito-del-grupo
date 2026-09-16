import Common "common";
import Matches "matches";

module {
  /// Final result and line-ups of a played match.
  public type MatchResult = {
    matchId : Common.MatchId;
    goalsTeamA : Nat;
    goalsTeamB : Nat;
    teamA : [Common.PlayerId];
    teamB : [Common.PlayerId];
    recordedAt : Common.Timestamp;
  };

  /// Shared view of a recorded match result.
  public type MatchResultView = {
    matchId : Common.MatchId;
    goalsTeamA : Nat;
    goalsTeamB : Nat;
    teamA : [Common.PlayerId];
    teamB : [Common.PlayerId];
    recordedAt : Common.Timestamp;
  };

  /// Input payload for recording a match result.
  public type MatchResultInput = {
    goalsTeamA : Nat;
    goalsTeamB : Nat;
    teamA : [Common.PlayerId];
    teamB : [Common.PlayerId];
  };

  /// A past match with its result and the players who took part.
  public type MatchHistoryEntry = {
    match : Matches.MatchView;
    result : ?MatchResultView;
    players : [Common.PlayerId];
  };

  /// Errors a result mutation can report to the caller.
  public type ResultError = {
    #notAuthorized;
    #notFound : Common.MatchId;
    #invalidInput : Text;
  };
};
