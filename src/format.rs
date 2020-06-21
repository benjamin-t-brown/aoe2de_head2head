extern crate chrono;

use chrono::prelude::*;

use crate::fetch;

pub fn timestamp_to_date(timestamp: i64) -> String {
  let naive = NaiveDateTime::from_timestamp(timestamp, 0);
  let date_time: DateTime<Utc> = DateTime::from_utc(naive, Utc);
  return format!("{}", date_time.format("%Y-%m-%d %H:%M:%S"));
}

pub fn leaderboard_id_to_name(leaderboard_id: fetch::LeaderboardId) -> String {
    return if leaderboard_id == fetch::LeaderboardId::RankedSolo {
    String::from("solo")
  } else {
    String::from("team")
  };
}

pub fn ratings_to_string(
  leaderboard_name1: &str,
  rating1: i32,
  leaderboard_name2: &str,
  rating2: i32,
) -> String {
  return format!(
    "({} elo in game={}, current {} elo={})",
    leaderboard_name1, rating1, leaderboard_name2, rating2
  );
}

pub fn get_leaderboard_id_from_name(leaderboard_name: &str) -> fetch::LeaderboardId {
  if leaderboard_name == "solo" {
    fetch::LeaderboardId::RankedSolo
  } else {
    fetch::LeaderboardId::RankedTeam
  }
}

pub fn get_opposite_leaderboard_id(leaderboard_id: fetch::LeaderboardId) -> fetch::LeaderboardId {
  if leaderboard_id == fetch::LeaderboardId::RankedSolo {
    fetch::LeaderboardId::RankedTeam
  } else {
    fetch::LeaderboardId::RankedSolo
  }
}
