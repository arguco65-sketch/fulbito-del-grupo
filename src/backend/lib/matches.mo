import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Types "../types/matches";

module {
  /// Returns upcoming (not cancelled) matches with a date of today or later,
  /// ordered by date.
  public func listUpcomingMatches(matches : Map.Map<Nat, Types.Match>) : [Types.MatchView] {
    let today = todayText();
    let active = matches.values().filter(func m = not m.cancelled and m.date >= today).map(func m = toView(m)).toArray();
    active.sort(func (a, b) = compareByDate(a, b));
  };

  /// Returns every match, including cancelled ones.
  public func listAllMatches(matches : Map.Map<Nat, Types.Match>) : [Types.MatchView] {
    let all = matches.values().map(func m = toView(m)).toArray();
    all.sort(func (a, b) = compareByDate(a, b));
  };

  /// Returns one match by id, or null when absent.
  public func getMatch(matches : Map.Map<Nat, Types.Match>, id : Nat) : ?Types.MatchView {
    switch (matches.get(id)) {
      case (?m) { ?toView(m) };
      case null { null };
    };
  };

  /// Creates a match and returns its new id.
  public func createMatch(matches : Map.Map<Nat, Types.Match>, nextId : { var value : Nat }, input : Types.MatchInput) : Nat {
    let id = nextId.value;
    nextId.value := id + 1;
    matches.add(id, {
      id;
      date = input.date;
      time = input.time;
      place = input.place;
      maxPlayers = input.maxPlayers;
      cancelled = false;
      createdAt = Time.now();
    });
    id;
  };

  /// Updates an existing match.
  public func updateMatch(matches : Map.Map<Nat, Types.Match>, id : Nat, input : Types.MatchInput) : () {
    switch (matches.get(id)) {
      case (?m) {
        matches.add(id, {
          id = m.id;
          date = input.date;
          time = input.time;
          place = input.place;
          maxPlayers = input.maxPlayers;
          cancelled = m.cancelled;
          createdAt = m.createdAt;
        });
      };
      case null {};
    };
  };

  /// Cancels a match without deleting it.
  public func cancelMatch(matches : Map.Map<Nat, Types.Match>, id : Nat) : () {
    switch (matches.get(id)) {
      case (?m) {
        matches.add(id, {
          id = m.id;
          date = m.date;
          time = m.time;
          place = m.place;
          maxPlayers = m.maxPlayers;
          cancelled = true;
          createdAt = m.createdAt;
        });
      };
      case null {};
    };
  };

  /// Projects a stored match to its shared view.
  public func toView(m : Types.Match) : Types.MatchView {
    {
      id = m.id;
      date = m.date;
      time = m.time;
      place = m.place;
      maxPlayers = m.maxPlayers;
      cancelled = m.cancelled;
      createdAt = m.createdAt;
    };
  };

  /// Today's date as sortable text, matching the stored 'YYYY-MM-DD' format.
  func todayText() : Text {
    let seconds = Time.now() / 1_000_000_000;
    let days = seconds / 86_400;
    let (year, month, day) = civilFromDays(days);
    pad(year, 4) # "-" # pad(month, 2) # "-" # pad(day, 2);
  };

  /// Converts days since the Unix epoch to a civil (year, month, day) date.
  func civilFromDays(days : Int) : (Int, Int, Int) {
    let z = days + 719_468;
    let era = (if (z >= 0) { z } else { z - 146_096 }) / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if (mp < 10) { mp + 3 } else { mp - 9 };
    (if (m <= 2) { y + 1 } else { y }, m, d);
  };

  /// Left-pads a non-negative number with zeros to the given width.
  func pad(value : Int, width : Nat) : Text {
    var text = value.toText();
    while (text.size() < width) {
      text := "0" # text;
    };
    text;
  };

  /// Orders matches by date then time, both stored as sortable text.
  func compareByDate(a : Types.MatchView, b : Types.MatchView) : Order.Order {
    let byDate = a.date.compare(b.date);
    switch (byDate) {
      case (#equal) { a.time.compare(b.time) };
      case (other) { other };
    };
  };
};
