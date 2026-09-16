import Common "common";

module {
  /// A member of the group's roster.
  public type Player = {
    id : Common.PlayerId;
    name : Text;
    nickname : Text;
    position : Text;
    phone : Text;
    createdAt : Common.Timestamp;
  };

  /// Shared view of a player returned by the public API.
  public type PlayerView = {
    id : Common.PlayerId;
    name : Text;
    nickname : Text;
    position : Text;
    phone : Text;
    createdAt : Common.Timestamp;
  };

  /// Input payload for creating or updating a player.
  public type PlayerInput = {
    name : Text;
    nickname : Text;
    position : Text;
    phone : Text;
  };

  /// Errors a roster mutation can report to the caller.
  public type RosterError = {
    #notAuthorized;
    #notFound : Common.PlayerId;
    #invalidInput : Text;
  };
};
