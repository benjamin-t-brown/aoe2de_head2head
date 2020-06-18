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

fn leaderboard_id_to_name(leaderboard_id: fetch::LeaderboardId) -> String {
  return if leaderboard_id == fetch::LeaderboardId::RankedSolo {
    String::from("solo")
  } else {
    String::from("team")
  };
}

fn ratings_to_string(
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

fn write_output(
  player_name: String,
  records: &std::collections::HashMap<i32, player_tracker::Record>,
  players: &std::collections::HashMap<i32, fetch::MatchHistoryPlayerResponse>,
) -> Result<(), RuntimeError> {
  let filename = format!("{}/{}_output.csv", env!("CARGO_MANIFEST_DIR"), player_name);
  println!("writing... {}", filename);
  let mut output = File::create(filename)?;
  write!(
    output,
    "profile_id,player_name,num_games,wins_against,losses_to,elo,date_last_played\n"
  )?;

  for (enemy_profile_id, record) in records.iter() {
    let row = match players.get(enemy_profile_id) {
      None => {
        println!("Continued {}", enemy_profile_id);
        continue;
      },
      Some(player) => record.format(player),
    };
    write!(output, "{}\n", row)?;
  }

  Ok(())
}

fn run(player_name_arg: &str, leaderboard_name_arg: &str) -> Result<(), RuntimeError> {
  let mut players: std::collections::HashMap<i32, fetch::MatchHistoryPlayerResponse> =
    std::collections::HashMap::new();

  let leaderboard_id = if leaderboard_name_arg == "solo" {
    println!("Fetching match history for RANKED_SOLO");
    fetch::LeaderboardId::RankedSolo
  } else {
    println!("Fetching match history for RANKED_TEAM");
    fetch::LeaderboardId::RankedTeam
  };
  let leaderboard_id_alt = if leaderboard_id == fetch::LeaderboardId::RankedSolo {
    fetch::LeaderboardId::RankedTeam
  } else {
    fetch::LeaderboardId::RankedSolo
  };

  let leaderboard_name = leaderboard_id_to_name(leaderboard_id);
  let leaderboard_name_alt = leaderboard_id_to_name(leaderboard_id_alt);

  println!(
    "Searching ranked {} playlist for player named '{}'...",
    leaderboard_name, player_name_arg
  );
  let player_resp = match fetch::fetch_player(&player_name_arg, leaderboard_id)? {
    Some(m) => m,
    None => {
      panic!("Player not found in searched playlist.");
    }
  };

  let profile_id = player_resp.profile_id;
  let mut pt = player_tracker::PlayerTracker::new(profile_id);

  let mut match_history = match fetch::fetch_match_history(profile_id)? {
    Some(m) => m,
    None => return Err(RuntimeError::new("Could not get match history.")),
  };

  println!("Retaining match history: {} games", match_history.len());

  match_history.retain(|mh| mh.get_leaderboard_id() == leaderboard_id);

  if match_history.len() == 0 {
    return Err(RuntimeError::new("Player has not played any team games."));
  }

  let most_recent_game = &match_history[0];
  println!("Processing match history: {} games", match_history.len());

  for i in (0..match_history.len() - 1).rev() {
    let game = &match_history[i];
    pt.process_match(game);
    let other_team = game.get_opposing_team(profile_id);
    for &enemy_player in &other_team {
      players.insert(enemy_player.get_profile_id(), enemy_player.clone());
    }
    let my_team = game.get_my_team(profile_id);
    for &ally_player in &my_team {
      players.insert(ally_player.get_profile_id(), ally_player.clone());
    }
  }

  println!("");
  println!(
    "Most recent game: {}",
    timestamp_to_date(most_recent_game.started)
  );
  println!("");

  let my_player_in_game = match most_recent_game.get_player_by_profile_id(profile_id) {
    Some(p) => p,
    None => panic!("Player who was looked up not found in game somehow."),
  };

  let other_team = most_recent_game.get_opposing_team(profile_id);
  let mut other_team_names: String = String::default();
  let mut other_team_records: String = String::default();
  for &enemy_player in &other_team {
    let alt_elo = fetch::fetch_rating(&enemy_player.get_name(), leaderboard_id_alt);
    other_team_names += &format!("{}", enemy_player.get_name());
    let (wins, losses) = pt.get_win_loss_record(enemy_player.get_profile_id());
    other_team_records += &format!(
      "  {} {}: wins against {}, losses to {}\n",
      enemy_player.get_name(),
      ratings_to_string(
        &leaderboard_name,
        enemy_player.get_rating(),
        &leaderboard_name_alt,
        alt_elo
      ),
      wins,
      losses
    );
  }
  let my_team = most_recent_game.get_my_team(profile_id);
  let mut my_team_names = String::from("\n");
  for &ally_player in &my_team {
    let alt_elo = fetch::fetch_rating(&ally_player.get_name(), leaderboard_id_alt);
    my_team_names += &format!(
      "  {}:({} elo in game={}, current {} elo={})\n",
      ally_player.get_name(),
      leaderboard_name,
      ally_player.get_rating(),
      leaderboard_name_alt,
      alt_elo
    );
  }

  let alt_elo = fetch::fetch_rating(&player_resp.name, leaderboard_id_alt);

  println!("");
  println!(
    "{}:{}",
    player_resp.name,
    ratings_to_string(
      &leaderboard_name,
      player_resp.get_rating(),
      &leaderboard_name_alt,
      alt_elo
    )
  );
  if my_team_names.len() > 1 {
    println!(" Teammates: {}", my_team_names);
  }
  println!("---");

  let is_game_in_progress = match most_recent_game.finished {
    Some(_) => {
      println!(
        "Most recent game completed. Victory? {}.",
        my_player_in_game.is_win()
      );
      false
    }
    None => {
      println!("Game in progress!");
      println!("Match id: {}", most_recent_game.get_match_id());
      true
    }
  };
  println!("");

  println!(
    "{} against",
    if is_game_in_progress {
      "Playing"
    } else {
      "Played"
    }
  );
  println!("{}", other_team_records);

  write_output(
    format!("{}_{}", player_resp.name, leaderboard_name),
    &pt.records,
    &players,
  )?;

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
  let mut player_name: String = String::from("");
  let mut leaderboard_name: String = String::from("");
  let is_error = match args.len() {
    1 => {
      println!("No args given, expected `<player_name> <?leaderboard_id>`");
      true
    }
    2 => {
      player_name = String::from(&args[1]);
      false
    }
    3 => {
      player_name = String::from(&args[1]);
      leaderboard_name = String::from(&args[2]);
      false
    }
    _ => {
      println!("Invalid number of args given, expected `<player_name> <?leaderboard_id>`");
      true
    }
  };

  if is_error {
    return;
  }

  println!("Program started");
  std::process::exit(match run(&player_name, &leaderboard_name) {
    Ok(_) => 0,
    Err(err) => {
      eprintln!("error: {:?}", err);
      1
    }
  });
}
