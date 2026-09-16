import Common "common";

module {
  /// A player's attendance answer for one match.
  public type Attendance = {
    matchId : Common.MatchId;
    playerId : Common.PlayerId;
    status : Common.AttendanceStatus;
    updatedAt : Common.Timestamp;
  };

  /// Shared view of an attendance answer.
  public type AttendanceView = {
    matchId : Common.MatchId;
    playerId : Common.PlayerId;
    status : Common.AttendanceStatus;
    updatedAt : Common.Timestamp;
  };

  /// A confirmed player together with the roster data needed to display them.
  public type ConfirmedPlayer = {
    playerId : Common.PlayerId;
    name : Text;
    nickname : Text;
    position : Text;
  };

  /// Live attendance summary for a match.
  public type AttendanceSummary = {
    matchId : Common.MatchId;
    confirmed : [ConfirmedPlayer];
    declined : [ConfirmedPlayer];
    pending : [ConfirmedPlayer];
    spotsLeft : Nat;
  };

  /// Errors an attendance mutation can report to the caller.
  public type AttendanceError = {
    #notAuthorized;
    #notFound : Common.MatchId;
    #playerNotFound : Common.PlayerId;
    #matchFull;
    #matchCancelled;
  };
};
