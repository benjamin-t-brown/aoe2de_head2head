extern crate reqwest;
extern crate serde;
extern crate serde_derive;
extern crate serde_json;

use crate::error::RuntimeError;

const AOE2NET_API_BASE_URL: &'static str = "https://aoe2.net/api";

#[derive(PartialEq, Copy, Clone)]
pub enum LeaderboardId {
  Unranked = 2,
  RankedSolo = 3,
  RankedTeam = 4,
}

impl LeaderboardId {
  pub fn to_leaderboard_id(leaderboard_id: i32) -> LeaderboardId {
    let id = match leaderboard_id {
      leaderboard_id if leaderboard_id == LeaderboardId::RankedSolo as i32 => {
        LeaderboardId::RankedSolo
      }
      leaderboard_id if leaderboard_id == LeaderboardId::RankedTeam as i32 => {
        LeaderboardId::RankedTeam
      }
      _ => LeaderboardId::Unranked,
    };
    return id;
  }
}

impl std::fmt::Display for LeaderboardId {
  fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
    match self {
      LeaderboardId::RankedSolo => write!(f, "3"),
      LeaderboardId::RankedTeam => write!(f, "4"),
      LeaderboardId::Unranked => write!(f, "2"),
    }
  }
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone, Default)]
pub struct PlayerResponse {
  pub profile_id: i32,
  pub name: String,
  pub icon: Option<String>,
  pub rank: Option<i32>,
  pub rating: Option<i32>,
  pub previous_rating: Option<i32>,
  pub steam_id: Option<String>,
  pub last_match: Option<i32>,
  pub last_match_time: Option<i32>,
}

impl PlayerResponse {
  pub fn get_rating(&self) -> i32 {
    match self.rating {
      None => 0,
      Some(r) => r,
    }
  }
}

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct LookupPlayerResponse {
  pub total: i32,
  pub leaderboard_id: i32,
  pub start: i32,
  pub count: i32,
  pub leaderboard: Vec<PlayerResponse>,
  pub steam_id: Option<String>,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone, Default)]
pub struct MatchHistoryPlayerResponse {
  pub profile_id: Option<i32>,
  pub steam_id: Option<String>,
  pub team: Option<i32>,
  pub name: Option<String>,
  pub rating: Option<i32>,
  pub won: Option<bool>,
}

impl MatchHistoryPlayerResponse {
  pub fn get_profile_id(&self) -> i32 {
    match self.profile_id {
      None => 0,
      Some(r) => r,
    }
  }
  pub fn get_rating(&self) -> i32 {
    match self.rating {
      None => 0,
      Some(r) => r,
    }
  }
  pub fn get_name(&self) -> String {
    match &self.name {
      None => String::default(),
      Some(r) => String::from(r),
    }
  }
  pub fn get_team(&self) -> i32 {
    match self.team {
      None => 0,
      Some(r) => r,
    }
  }
  pub fn is_win(&self) -> bool {
    match self.won {
      Some(value) => value,
      None => false,
    }
  }
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, Default)]
pub struct LastMatchResponse {
  pub profile_id: i32,
  pub last_match: Option<MatchHistoryGameResponse>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, Default)]
pub struct MatchHistoryGameResponse {
  pub match_id: String,
  pub num_players: Option<i32>,
  pub ranked: bool,
  pub started: i64,
  pub leaderboard_id: Option<i32>,
  pub lobby_id: Option<String>,
  pub match_uuid: Option<String>,
  pub version: Option<String>,
  pub finished: Option<i32>,
  pub players: Vec<MatchHistoryPlayerResponse>,
}

impl MatchHistoryGameResponse {
  pub fn get_player_by_profile_id(&self, profile_id: i32) -> Option<&MatchHistoryPlayerResponse> {
    for player in &self.players {
      if player.get_profile_id() == profile_id {
        return Some(player);
      }
    }
    None
  }
  pub fn get_player_by_profile_id_mut(
    &mut self,
    profile_id: i32,
  ) -> Option<&mut MatchHistoryPlayerResponse> {
    for player in self.players.iter_mut() {
      if player.get_profile_id() == profile_id {
        return Some(player);
      }
    }
    None
  }
  pub fn get_team(&self, team_id: i32) -> Vec<&MatchHistoryPlayerResponse> {
    let mut ret: Vec<&MatchHistoryPlayerResponse> = vec![];
    for player in &self.players {
      if player.get_team() == team_id {
        ret.push(player);
      }
    }
    return ret;
  }
  pub fn get_leaderboard_id(&self) -> LeaderboardId {
    match self.leaderboard_id {
      Some(id) => LeaderboardId::to_leaderboard_id(id),
      None => LeaderboardId::Unranked,
    }
  }
  pub fn get_team_id_by_profile_id(&self, profile_id: i32) -> i32 {
    for player in &self.players {
      if player.get_profile_id() == profile_id {
        return player.get_team();
      }
    }
    1
  }
  pub fn get_profile_ids_on_team(&self, team: i32) -> Vec<i32> {
    let mut ret: Vec<i32> = vec![];
    for player in &self.players {
      if player.get_team() == team {
        ret.push(player.get_profile_id());
      }
    }
    return ret;
  }
  pub fn get_opposing_team_profile_ids(&self, my_profile_id: i32) -> Vec<i32> {
    let my_team_id = self.get_team_id_by_profile_id(my_profile_id);
    let mut other_team_id = 1;
    if my_team_id == 1 {
      other_team_id = 2;
    }
    return self.get_profile_ids_on_team(other_team_id);
  }
  pub fn get_opposing_team(&self, my_profile_id: i32) -> Vec<&MatchHistoryPlayerResponse> {
    let my_team_id = self.get_team_id_by_profile_id(my_profile_id);
    let mut other_team_id = 1;
    if my_team_id == 1 {
      other_team_id = 2;
    }
    return self.get_team(other_team_id);
  }
  pub fn get_my_team(&self, my_profile_id: i32) -> Vec<&MatchHistoryPlayerResponse> {
    let my_team_id = self.get_team_id_by_profile_id(my_profile_id);
    let mut my_team = self.get_team(my_team_id);
    my_team.retain(|player| player.get_profile_id() != my_profile_id);
    return my_team;
  }
  pub fn get_match_id(&self) -> &str {
    return &self.match_id;
  }
}

pub fn fetch_player(
  name: &str,
  leaderboard_id: LeaderboardId,
) -> Result<Option<PlayerResponse>, reqwest::Error> {
  let url = format!(
    "{}/leaderboard?start=1&leaderboard_id={leaderboard_id}&search={name}",
    AOE2NET_API_BASE_URL,
    leaderboard_id = leaderboard_id,
    name = name
  );
  println!("[fetch] {}", url);
  let res = reqwest::blocking::get(&url)?;
  let players: LookupPlayerResponse = res.json()?;
  if players.count == 0 {
    return Ok(None);
  }
  Ok(Some(players.leaderboard[0].clone()))
}

pub async fn fetch_player_async(
  name: &str,
  leaderboard_id: LeaderboardId,
) -> Result<Option<PlayerResponse>, reqwest::Error> {
  let url = format!(
    "{}/leaderboard?start=1&leaderboard_id={leaderboard_id}&search={name}",
    AOE2NET_API_BASE_URL,
    leaderboard_id = leaderboard_id,
    name = name
  );
  println!("[fetch] {}", url);
  let players: LookupPlayerResponse = reqwest::get(&url).await?.json().await?;
  if players.count == 0 {
    return Ok(None);
  }
  Ok(Some(players.leaderboard[0].clone()))
}

pub fn fetch_rating(name: &str, leaderboard_id: LeaderboardId) -> i32 {
  let _fetch_rating = || -> Result<i32, RuntimeError> {
    match fetch_player(&name, leaderboard_id)? {
      Some(m) => Ok(m.get_rating()),
      None => Ok(-1),
    }
  };

  return match _fetch_rating() {
    Ok(v) => v,
    Err(err) => {
      eprintln!("error: {:?}", err);
      0
    }
  };
}

pub fn fetch_match_history(
  profile_id: i32,
) -> Result<Option<Vec<MatchHistoryGameResponse>>, reqwest::Error> {
  println!("Get match history for id: '{}'", profile_id);
  let url = format!(
    "{}/player/matches?game=aoe2de&start=0&count=9999&profile_id={profile_id}",
    AOE2NET_API_BASE_URL,
    profile_id = profile_id,
  );
  println!("[fetch] {}", url);
  let res = reqwest::blocking::get(&url)?;
  let match_history: Vec<MatchHistoryGameResponse> = res.json()?;
  Ok(Some(match_history))
}

pub async fn fetch_match_history_async(
  profile_id: i32,
) -> Result<Option<Vec<MatchHistoryGameResponse>>, reqwest::Error> {
  println!("Get match history for id: '{}'", profile_id);
  let url = format!(
    "{}/player/matches?game=aoe2de&start=0&count=9999&profile_id={profile_id}",
    AOE2NET_API_BASE_URL,
    profile_id = profile_id,
  );
  println!("[fetch] {}", url);
  let match_history: Vec<MatchHistoryGameResponse> = reqwest::get(&url).await?.json().await?;
  Ok(Some(match_history))
}

pub async fn fetch_latest_match_async(
  profile_id: i32,
) -> Result<Option<LastMatchResponse>, reqwest::Error> {
  println!("Get lst match id: '{}'", profile_id);
  let url = format!(
    "{}/player/matches?game=aoe2de&start=0&count=1&profile_id={profile_id}",
    AOE2NET_API_BASE_URL,
    profile_id = profile_id,
  );
  println!("[fetch] {}", url);
  let match_history: Vec<MatchHistoryGameResponse> = reqwest::get(&url).await?.json().await?;
  Ok(Some(LastMatchResponse {
    profile_id,
    last_match: Some(match_history[0].clone()),
  }))
}
