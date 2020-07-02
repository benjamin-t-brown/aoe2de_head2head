use actix_web::{get, Responder, HttpResponse, HttpRequest, web};
use actix_files::NamedFile;

use crate::error::RuntimeError;
use crate::player_tracker;

// taken from https://github.com/diegopacheco/rust-playground/tree/master/rust-microservice/news-service/src

use crate::fetch;
use crate::format;

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
// let mut pt = player_tracker::PlayerTracker::new(profile_id);
async fn create_lookup_player_response(
  player_name: &str,
  leaderboard_id: fetch::LeaderboardId,
) -> Result<LookupPlayerResponse, RuntimeError> {
  let player_resp = match fetch::fetch_player_async(&player_name, leaderboard_id).await? {
    Some(m) => m,
    None => return Err(RuntimeError::new("Could not get player.")),
  };

  let player_name = player_resp.name;
  let profile_id = player_resp.profile_id;
  let leaderboard_name = format::leaderboard_id_to_name(leaderboard_id);

  let mut pt = player_tracker::PlayerTracker::new(profile_id);

  let mut match_history = match fetch::fetch_match_history_async(profile_id).await? {
    Some(m) => m,
    None => return Err(RuntimeError::new("Could not get match history.")),
  };

  match_history.retain(|mh| mh.get_leaderboard_id() == leaderboard_id);

  if match_history.len() == 0 {
    return Err(RuntimeError::new("Player has not played any games."));
  }

  pt.track_players(&match_history);

  Ok(LookupPlayerResponse {
    profile_id,
    player_name,
    leaderboard_id: leaderboard_id as i32,
    leaderboard_name,
    tracker: pt,
    most_recent_game: match_history[0].clone(),
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
      HttpResponse::InternalServerError()
        .json(format!("Error getting match history for player: {:?}", err))
    }
  }
}
