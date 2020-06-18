extern crate chrono;

use crate::fetch;
use chrono::prelude::*;

fn timestamp_to_string(timestamp: i64) -> String {
  let naive = NaiveDateTime::from_timestamp(timestamp, 0);
  let date_time: DateTime<Utc> = DateTime::from_utc(naive, Utc);
  let date = date_time.format("%Y-%m-%d %H:%M:%S");
  return format!("{}", date);
}

pub struct Record {
  pub profile_id: i32,
  pub wins_against: i32,
  pub losses_to: i32,
  pub games: Vec<fetch::MatchHistoryGameResponse>,
  pub last_played_against: String,
}

impl Record {
  pub fn format(&self, player: &fetch::MatchHistoryPlayerResponse) -> String {
    let game = match self.games.get(self.games.len() - 1) {
      Some(g) => g,
      None => return String::default(),
    };
    let player_name = player.get_name().replace(",", "");
    return format!(
      "{profile_id},{player_name},{num_games},{wins_against},{losses_to},{elo},{date}",
      profile_id = player.get_profile_id(),
      player_name = player_name,
      num_games = self.games.len(),
      wins_against = self.wins_against,
      losses_to = self.losses_to,
      elo = player.get_rating(),
      date = timestamp_to_string(game.started)
    );
  }
}

pub struct PlayerTracker {
  pub profile_id: i32,
  pub wins: i32,
  pub losses: i32,
  pub records: std::collections::HashMap<i32, Record>,
}

impl PlayerTracker {
  pub fn new(profile_id: i32) -> PlayerTracker {
    PlayerTracker {
      profile_id,
      wins: 0,
      losses: 0,
      records: std::collections::HashMap::new(),
    }
  }
  pub fn add_record(
    &mut self,
    other_profile_id: i32,
    is_win: Option<bool>,
    game: &fetch::MatchHistoryGameResponse,
  ) {
    let mut win_ctr = 0;
    let mut loss_ctr = 0;
    match is_win {
      Some(won) => {
        if won {
          self.wins += 1;
          win_ctr = 1;
        } else {
          self.losses += 1;
          loss_ctr = 1;
        }
      }
      None => (),
    };

    let mut record = match self.records.get_mut(&other_profile_id) {
      None => {
        self.records.insert(
          other_profile_id,
          Record {
            profile_id: other_profile_id,
            wins_against: win_ctr,
            losses_to: loss_ctr,
            games: vec![game.clone()],
            last_played_against: timestamp_to_string(game.started),
          },
        );
        return;
      }
      Some(record) => record,
    };

    if win_ctr == 1 {
      record.wins_against += 1;
    } else if loss_ctr == 1 {
      record.losses_to += 1
    }

    record.games.push(game.clone());
  }
  pub fn get_win_loss_record(&self, other_profile_id: i32) -> (i32, i32) {
    match self.records.get(&other_profile_id) {
      None => (0, 0),
      Some(record) => (record.wins_against, record.losses_to),
    }
  }
  pub fn process_match(&mut self, game: &fetch::MatchHistoryGameResponse) {
    let is_win = match game.get_player_by_profile_id(self.profile_id) {
      Some(p) => p.won,
      None => None,
    };
    let other_team_profile_ids = game.get_opposing_team_profile_ids(self.profile_id);
    for profile_id in &other_team_profile_ids {
      self.add_record(*profile_id, is_win, game);
    }
  }
}
