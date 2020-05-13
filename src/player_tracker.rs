extern crate chrono;

use crate::fetch;
use chrono::prelude::*;

pub struct Record {
  pub profile_id: i32,
  pub wins_against: i32,
  pub losses_to: i32,
  pub games: Vec<fetch::MatchHistoryGameResponse>,
}

impl Record {
  pub fn format(&self, player: &fetch::MatchHistoryPlayerResponse) -> String {
    let game = match self.games.get(self.games.len() - 1) {
      Some(g) => g,
      None => return String::default(),
    };
    let naive = NaiveDateTime::from_timestamp(game.started, 0);
    let date_time: DateTime<Utc> = DateTime::from_utc(naive, Utc);
    let new_date = date_time.format("%Y-%m-%d %H:%M:%S");
    return format!(
      "{profile_id},{player_name},{wins_against},{losses_to},{elo},{date}",
      profile_id = player.get_profile_id(),
      player_name = player.get_name(),
      wins_against = self.wins_against,
      losses_to = self.losses_to,
      elo = player.get_rating(),
      date = new_date
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
      profile_id: profile_id,
      wins: 0,
      losses: 0,
      records: std::collections::HashMap::new(),
    }
  }
  pub fn add_record(
    &mut self,
    other_profile_id: i32,
    is_win: bool,
    game: &fetch::MatchHistoryGameResponse,
  ) {
    if is_win {
      self.wins += 1;
    } else {
      self.losses += 1;
    }

    let mut record = match self.records.get_mut(&other_profile_id) {
      None => {
        self.records.insert(
          other_profile_id,
          Record {
            profile_id: other_profile_id,
            wins_against: if is_win { 1 } else { 0 },
            losses_to: if is_win { 0 } else { 1 },
            games: vec![game.clone()],
          },
        );
        return;
      }
      Some(record) => record,
    };

    if is_win {
      record.wins_against += 1;
    } else {
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
  pub fn process_match(&mut self, game: &fetch::MatchHistoryGameResponse, next_match_rating: i32) {
    let rating = match game.get_player_by_profile_id(self.profile_id) {
      None => 0,
      Some(p) => p.get_rating(),
    };
    let other_team_profile_ids = game.get_opposing_team_profile_ids(self.profile_id);
    for profile_id in &other_team_profile_ids {
      if rating != next_match_rating {
        self.add_record(*profile_id, rating < next_match_rating, game);
      }
    }
  }
}
