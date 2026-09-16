import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Types "../types/results";
import AttendanceTypes "../types/attendance";
import MatchTypes "../types/matches";
import MatchLib "matches";

module {
  /// Records the final result and line-ups of a played match.
  public func recordResult(
    results : Map.Map<Nat, Types.MatchResult>,
    matchId : Nat,
    input : Types.MatchResultInput,
  ) : () {
    results.add(matchId, {
      matchId;
      goalsTeamA = input.goalsTeamA;
      goalsTeamB = input.goalsTeamB;
      teamA = input.teamA;
      teamB = input.teamB;
      recordedAt = Time.now();
    });
  };

  /// Returns the recorded result of a match, or null when not played yet.
  public func getResult(results : Map.Map<Nat, Types.MatchResult>, matchId : Nat) : ?Types.MatchResultView {
    switch (results.get(matchId)) {
      case (?r) { ?toView(r) };
      case null { null };
    };
  };

  /// Returns past matches with their result and participants.
  public func listHistory(
    results : Map.Map<Nat, Types.MatchResult>,
    matches : Map.Map<Nat, MatchTypes.Match>,
    attendance : Map.Map<Nat, Map.Map<Nat, AttendanceTypes.Attendance>>,
  ) : [Types.MatchHistoryEntry] {
    let today = todayText();
    let entries = List.empty<Types.MatchHistoryEntry>();
    for (m in matches.values()) {
      if (not m.cancelled and m.date < today) {
        let result = switch (results.get(m.id)) {
          case (?r) { ?toView(r) };
          case null { null };
        };
        entries.add({
          match = MatchLib.toView(m);
          result;
          players = participants(m.id, result, attendance);
        });
      };
    };
    let all = entries.toArray();
    all.sort(func (a, b) = compareByDate(a.match, b.match));
  };

  /// Players who took part in a match: confirmed attendance, plus any recorded
  /// line-up, without duplicates.
  func participants(
    matchId : Nat,
    result : ?Types.MatchResultView,
    attendance : Map.Map<Nat, Map.Map<Nat, AttendanceTypes.Attendance>>,
  ) : [Nat] {
    let ids = List.empty<Nat>();
    switch (attendance.get(matchId)) {
      case (?byPlayer) {
        for (a in byPlayer.values()) {
          if (a.status == #confirmed) {
            ids.add(a.playerId);
          };
        };
      };
      case null {};
    };
    switch (result) {
      case (?r) {
        for (id in r.teamA.concat(r.teamB).values()) {
          if (not ids.contains(id)) {
            ids.add(id);
          };
        };
      };
      case null {};
    };
    ids.toArray();
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

  /// Projects a stored result to its shared view.
  public func toView(r : Types.MatchResult) : Types.MatchResultView {
    {
      matchId = r.matchId;
      goalsTeamA = r.goalsTeamA;
      goalsTeamB = r.goalsTeamB;
      teamA = r.teamA;
      teamB = r.teamB;
      recordedAt = r.recordedAt;
    };
  };

  /// Orders history entries by date then time, both stored as sortable text.
  func compareByDate(a : MatchTypes.MatchView, b : MatchTypes.MatchView) : Order.Order {
    let byDate = a.date.compare(b.date);
    switch (byDate) {
      case (#equal) { a.time.compare(b.time) };
      case (other) { other };
    };
  };
};
