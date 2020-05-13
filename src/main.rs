mod error;
mod fetch;
mod player_tracker;

extern crate chrono;

use chrono::prelude::*;
use error::RuntimeError;
use std::env;
use std::fs::File;
use std::io::Write;

fn timestamp_to_date(timestamp: i64) -> String {
  let naive = NaiveDateTime::from_timestamp(timestamp, 0);
  let date_time: DateTime<Utc> = DateTime::from_utc(naive, Utc);
  return format!("{}", date_time.format("%Y-%m-%d %H:%M:%S"));
}

fn write_output(
  player_name: String,
  records: &std::collections::HashMap<i32, player_tracker::Record>,
  players: &std::collections::HashMap<i32, fetch::MatchHistoryPlayerResponse>,
) -> Result<(), RuntimeError> {
  let filename = format!("{}/{}_output.csv", env!("CARGO_MANIFEST_DIR"), player_name);
  println!("writing... {}", filename);
  let mut output = File::create(filename)?;
  write!(output, "profile_id,player_name,wins_against,losses_to,elo,date_last_played\n")?;

  for (enemy_profile_id, record) in records.iter() {
    let row = match players.get(enemy_profile_id) {
      None => continue,
      Some(player) => record.format(player),
    };
    write!(output, "{}\n", row)?;
  }

  Ok(())
}

fn run(fetch_name: &str) -> Result<(), RuntimeError> {
  let mut players: std::collections::HashMap<i32, fetch::MatchHistoryPlayerResponse> =
    std::collections::HashMap::new();

  let player_team = match fetch::fetch_player(&fetch_name, fetch::LeaderboardId::RankedTeam)? {
    Some(m) => m,
    None => return Err(RuntimeError::new("No player found with that name")),
  };

  let profile_id = player_team.profile_id;
  let mut pt = player_tracker::PlayerTracker::new(profile_id);

  let mut match_history = match fetch::fetch_match_history(profile_id)? {
    Some(m) => m,
    None => return Err(RuntimeError::new("Could not get match history.")),
  };

  println!("Retaining match history: {} games", match_history.len());

  match_history.retain(|mh| {
    mh.get_leaderboard_id() == fetch::LeaderboardId::RankedTeam
      || mh.get_leaderboard_id() == fetch::LeaderboardId::RankedSolo
  });

  if match_history.len() == 0 {
    return Err(RuntimeError::new("Player has not played any team games."));
  }

  let most_recent_game = &match_history[0];
  println!("Processing match history: {} games", match_history.len());

  for i in (1..match_history.len() - 1).rev() {
    let game = &match_history[i];
    let next_game = &match_history[i - 1];
    let next_match_rating = match next_game.get_player_by_profile_id(profile_id) {
      None => 0,
      Some(p) => p.get_rating(),
    };
    pt.process_match(game, next_match_rating);
    let other_team = game.get_opposing_team(profile_id);
    for &enemy_player in &other_team {
      players.insert(enemy_player.get_profile_id(), enemy_player.clone());
    }
    let my_team = game.get_my_team(profile_id);
    for &ally_player in &my_team {
      players.insert(ally_player.get_profile_id(), ally_player.clone());
    }
  }

  pt.process_match(most_recent_game, player_team.get_rating());
  println!("");
  println!(
    "Most recent game: {}",
    timestamp_to_date(most_recent_game.started)
  );
  println!("");

  let my_player_in_game = most_recent_game.get_player_by_profile_id(profile_id);
  if let Some(p) = &my_player_in_game {
    let r1 = p.get_rating();
    let r2 = player_team.get_rating();

    println!("Rating in recent game: {}", r1);
    println!("Rating now: {}", r2);
    println!("");
    if r1 == r2 {
      println!("Game in progress! (most likely)");
      println!("");
    } else {
      println!(
        "Game is complete! (most likely) rating_now={} rating_in_game={}",
        r2, r1
      );
      println!("");
    }
  }

  let other_team = most_recent_game.get_opposing_team(profile_id);
  let mut other_team_names: String = String::default();
  let mut other_team_records: String = String::default();
  for &enemy_player in &other_team {
    other_team_names += &format!(
      "{}:(elo={}) ",
      enemy_player.get_name(),
      enemy_player.get_rating()
    );
    let (wins, losses) = pt.get_win_loss_record(enemy_player.get_profile_id());
    other_team_records += &format!(
      "{}: wins against {}, losses to {}\n",
      enemy_player.get_name(),
      wins,
      losses
    );
  }
  let my_team = most_recent_game.get_my_team(profile_id);
  let mut my_team_names = String::default();
  for &ally_player in &my_team {
    my_team_names += &format!(
      "{}:(elo={}) ",
      ally_player.get_name(),
      ally_player.get_rating()
    );
  }

  println!("{}:(elo={})", player_team.name, player_team.get_rating());
  if my_team_names.len() > 0 {
    println!(" Teammates: {}", my_team_names);
  }
  println!("---");
  println!("Played against -> {}", other_team_names);
  println!("{}", other_team_records);

  write_output(player_team.name, &pt.records, &players)?;

  // for (enemy_profile_id, record) in pt.records.iter() {
  //   match players.get(enemy_profile_id) {
  //     None => continue,
  //     Some(player) => record.print(player),
  //   }
  // }

  Ok(())
}

fn main() {
  let args: Vec<String> = env::args().collect();
  if args.len() == 1 {
    println!("No args given, expected a <player_name>.");
    return;
  }
  let fetch_name: String = String::from(&args[1]);
  println!("Program started");
  std::process::exit(match run(&fetch_name) {
    Ok(_) => 0,
    Err(err) => {
      eprintln!("error: {:?}", err);
      1
    }
  });
}
