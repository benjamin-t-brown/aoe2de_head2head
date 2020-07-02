use crate::fetch;
use serde::ser::{Serialize, Serializer, SerializeStruct};

pub struct Record {
  pub profile_id: i32,
  pub wins_against: i32,
  pub losses_to: i32,
  pub games: Vec<fetch::MatchHistoryGameResponse>,
  pub last_played_against: String,
}

impl Serialize for Record {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    let mut state = serializer.serialize_struct("Record", 4)?;
    state.serialize_field("profile_id", &self.profile_id)?;
    state.serialize_field("wins_against", &self.wins_against)?;
    state.serialize_field("losses_to", &self.losses_to)?;
    state.serialize_field("last_played_against", &self.last_played_against)?;
    state.end()
  }
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
      date = crate::format::timestamp_to_date(game.started)
    );
  }
}

pub struct PlayerTracker {
  pub profile_id: i32,
  pub wins: i32,
  pub losses: i32,
  pub records: std::collections::HashMap<i32, Record>,
  pub players: std::collections::HashMap<i32, fetch::MatchHistoryPlayerResponse>,
}

impl Serialize for PlayerTracker {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    let mut state = serializer.serialize_struct("PlayerTracker", 5)?;
    state.serialize_field("profile_id", &self.profile_id)?;
    state.serialize_field("wins", &self.wins)?;
    state.serialize_field("losses", &self.losses)?;
    state.serialize_field("records", &self.records)?;
    state.serialize_field("players", &self.players)?;
    state.end()
  }
}

impl PlayerTracker {
  pub fn new(profile_id: i32) -> PlayerTracker {
    PlayerTracker {
      profile_id,
      wins: 0,
      losses: 0,
      records: std::collections::HashMap::new(),
      players: std::collections::HashMap::new(),
    }
  }
  pub fn track_players(&mut self, match_history: &std::vec::Vec<fetch::MatchHistoryGameResponse>) {
    println!("Processing match history: {} games", match_history.len());

    for i in 1..match_history.len() {
      let game = &match_history[i];
      let future_game = &match_history[i - 1];
      self.process_match(game, future_game);
    }

    if match_history.len() > 0 {
      let most_recent_game = &match_history[0];
      let is_game_in_progress = most_recent_game.finished.unwrap_or(0) == 0;
      if !is_game_in_progress {
        self.process_match(most_recent_game, most_recent_game);
      }
    }
  }
  pub fn process_match(
    &mut self,
    game: &fetch::MatchHistoryGameResponse,
    future_game: &fetch::MatchHistoryGameResponse,
  ) {
    let player = game.get_player_by_profile_id(self.profile_id).unwrap();
    let is_win = match player.won {
      Some(is_win) => is_win,
      None => {
        let player_in_future_game = future_game
          .get_player_by_profile_id(self.profile_id)
          .unwrap_or(player);
        let future_rating = player_in_future_game.get_rating();
        let rating = player.get_rating();
        if rating > future_rating {
          false
        } else if rating < future_rating {
          true
        } else {
          println!(
            "Cannot determine if win or loss future_game_id={} future_rating={} game_id={} rating={}",
            future_game.get_match_id(), future_rating, game.get_match_id(), rating
          );
          return;
        }
      }
    };
    let other_team_profile_ids = game.get_opposing_team_profile_ids(self.profile_id);
    for profile_id in &other_team_profile_ids {
      self.add_record(*profile_id, is_win, game);
    }

    let other_team = game.get_opposing_team(self.profile_id);
    for &enemy_player in &other_team {
      self
        .players
        .insert(enemy_player.get_profile_id(), enemy_player.clone());
    }
    let my_team = game.get_my_team(self.profile_id);
    for &ally_player in &my_team {
      self
        .players
        .insert(ally_player.get_profile_id(), ally_player.clone());
    }
  }

  pub fn add_record(
    &mut self,
    other_profile_id: i32,
    is_win: bool,
    game: &fetch::MatchHistoryGameResponse,
  ) {
    let mut win_ctr = 0;
    let mut loss_ctr = 0;
    if is_win {
      self.wins += 1;
      win_ctr = 1;
    } else {
      self.losses += 1;
      loss_ctr = 1;
    }

    let mut record = match self.records.get_mut(&other_profile_id) {
      None => {
        self.records.insert(
          other_profile_id,
          Record {
            profile_id: other_profile_id,
            wins_against: win_ctr,
            losses_to: loss_ctr,
            games: vec![game.clone()],
            last_played_against: crate::format::timestamp_to_date(game.started),
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
}
