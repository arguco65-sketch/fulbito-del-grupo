module {
  /// Identifier for a player in the roster.
  public type PlayerId = Nat;

  /// Identifier for a scheduled match.
  public type MatchId = Nat;

  /// Nanoseconds since the epoch (Time.now()).
  public type Timestamp = Int;

  /// Attendance answer for a player on a given match.
  public type AttendanceStatus = {
    #confirmed;
    #declined;
  };

  /// Which side a player was on in a played match.
  public type TeamSide = {
    #teamA;
    #teamB;
  };
};
