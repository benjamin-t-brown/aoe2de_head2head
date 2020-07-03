use actix_web::{get, Responder, HttpResponse, HttpRequest, web};
use actix_files::NamedFile;

use crate::error::RuntimeError;
use crate::player_tracker;

// taken from https://github.com/diegopacheco/rust-playground/tree/master/rust-microservice/news-service/src

use crate::fetch;
use crate::format;
use crate::server::cache;

#[derive(serde::Serialize)]
struct LookupPlayerResponse {
  profile_id: i32,
  player_name: String,
  leaderboard_id: i32,
  leaderboard_name: String,
  tracker: player_tracker::PlayerTracker,
  most_recent_game: fetch::MatchHistoryGameResponse,
}

fn log_request(req: &HttpRequest) {
  println!("[SRV] {}", req.path());
}

async fn lookup_player_with_cache(
  player_name: &str,
  leaderboard_id: fetch::LeaderboardId,
) -> Result<fetch::PlayerResponse, RuntimeError> {
  let cache_key = format!("player-{}-{}", player_name, leaderboard_id);
  let cache_result = cache::select_from_cache(&cache_key);
  let player_resp: fetch::PlayerResponse;
  if cache_result == "" {
    println!("[SRV] Cache miss player, fetching result");
    player_resp = match fetch::fetch_player_async(&player_name, leaderboard_id).await? {
      Some(m) => m,
      None => return Err(RuntimeError::new("Could not get player.")),
    };
    let result_string = serde_json::to_string(&player_resp).unwrap_or(String::from(""));
    cache::insert_into_cache(&cache_key, &result_string);
  } else {
    println!("[SRV] Cache hit player, using cache");
    player_resp = match serde_json::from_str(&cache_result) {
      Ok(p) => p,
      Err(e) => panic!("Error parsing json from cache (player_resp): {:?}", e),
    };
  }
  Ok(player_resp)
}

async fn lookup_match_history_with_cache(
  profile_id: i32,
) -> Result<Vec<fetch::MatchHistoryGameResponse>, RuntimeError> {
  let cache_key = format!("matches-{}", profile_id);
  let cache_result = cache::select_from_cache(&cache_key);
  let match_history: Vec<fetch::MatchHistoryGameResponse>;
  if cache_result == "" {
    println!("[SRV] Cache miss match history, fetching result");
    match_history = match fetch::fetch_match_history_async(profile_id).await? {
      Some(m) => m,
      None => return Err(RuntimeError::new("Could not get match history.")),
    };
    let result_string = serde_json::to_string(&match_history).unwrap_or(String::from(""));
    cache::insert_into_cache(&cache_key, &result_string);
  } else {
    println!("[SRV] Cache hit match history, using cache");
    match_history = match serde_json::from_str(&cache_result) {
      Ok(p) => p,
      Err(e) => panic!(
        "Error parsing json from cache (match_history_resp): {:?}",
        e
      ),
    };
  }
  Ok(match_history)
}

async fn create_lookup_player_response(
  player_name: &str,
  leaderboard_id: fetch::LeaderboardId,
) -> Result<LookupPlayerResponse, RuntimeError> {
  let player_resp = lookup_player_with_cache(player_name, leaderboard_id).await?;
  let player_name = player_resp.name;
  let profile_id = player_resp.profile_id;
  let leaderboard_name = format::leaderboard_id_to_name(leaderboard_id);
  let mut pt = player_tracker::PlayerTracker::new(profile_id);

  let mut match_history = lookup_match_history_with_cache(profile_id).await?;
  match_history.retain(|mh| mh.get_leaderboard_id() == leaderboard_id);
  if match_history.len() == 0 {
    return Err(RuntimeError::new("Player has not played any games."));
  }

  pt.track_players(&match_history);

  let last_match_resp = match fetch::fetch_latest_match_async(profile_id).await? {
    Some(m) => m,
    None => return Err(RuntimeError::new("Could not get last match")),
  };

  Ok(LookupPlayerResponse {
    profile_id,
    player_name,
    leaderboard_id: leaderboard_id as i32,
    leaderboard_name,
    tracker: pt,
    most_recent_game: last_match_resp
      .last_match
      .unwrap_or(match_history[0].clone()),
  })
}

#[get("/")]
async fn index(req: HttpRequest) -> impl Responder {
  log_request(&req);
  NamedFile::open("ui/build/index.html")
}

#[get("/lookup/{player_name}/{leaderboard_name}")]
pub async fn lookup_player(req: HttpRequest, info: web::Path<(String, String)>) -> HttpResponse {
  log_request(&req);

  let player_name_arg = &info.0;
  let leaderboard_name_arg = &info.1;

  let leaderboard_id = format::get_leaderboard_id_from_name(&leaderboard_name_arg);

  match create_lookup_player_response(&player_name_arg, leaderboard_id).await {
    Ok(response) => HttpResponse::Ok().json(response),
    Err(err) => {
      println!("error getting match history for player {:?}", err);
      HttpResponse::NotFound().json(format!("Error getting match history for player: {:?}", err))
    }
  }
}
