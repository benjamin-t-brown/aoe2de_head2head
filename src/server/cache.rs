use rusqlite::Connection;
use rusqlite::NO_PARAMS;
use rusqlite::params;
use rusqlite::named_params;
use rusqlite::ToSql;
use std::time::{SystemTime, UNIX_EPOCH};

const DB_NAME: &str = "request-cache.db";

// 900s = 15 minutes
const CACHE_TIMEOUT_SECS: f64 = 900.0;

#[derive(Clone, Debug)]
struct KeyValueResult {
  key: String,
  value: String,
  last_updated: String,
}

pub fn init_cache() -> rusqlite::Result<()> {
  let conn = Connection::open(DB_NAME)?;
  conn.execute(
    "CREATE Table If not exists request_cache (
      key text not null,
      value text not null,
      last_updated text not null
  )",
    NO_PARAMS,
  )?;
  Ok(())
}

fn execute_query(query: &str, params: &[&dyn ToSql]) -> rusqlite::Result<()> {
  let conn = Connection::open(DB_NAME)?;
  // println!("[DB] {}", query);
  conn.execute(&query, params)?;
  Ok(())
}

fn select_key_value_result(key: &str) -> rusqlite::Result<Option<KeyValueResult>> {
  let conn = Connection::open(DB_NAME)?;
  let query = format!("SELECT key, value, last_updated FROM request_cache WHERE key LIKE :key");
  // println!("[DB] {} key={}", query, key);
  let mut stmt = conn.prepare(&query)?;
  let mut rows = stmt.query_named(named_params! { ":key": key })?;
  if let Some(row) = rows.next()? {
    let result = KeyValueResult {
      key: row.get(0)?,
      value: row.get(1)?,
      last_updated: row.get(2)?,
    };
    Ok(Some(result))
  } else {
    Ok(None)
  }
}

fn set_value(key: &str, value: &str) {
  let query = format!("DELETE FROM request_cache WHERE key LIKE ?1");
  execute_query(&query, params![key]).unwrap();

  let query = format!(
    "INSERT INTO request_cache (key, value, last_updated) VALUES(?1, ?2, strftime('%s','now'))",
  );
  execute_query(&query, params![key, value]).unwrap();
}

fn get_value(key: &str) -> (String, String) {
  let result = select_key_value_result(key).unwrap();
  match result {
    Some(result) => (result.value, result.last_updated),
    None => (String::from(""), String::from("")),
  }
}

pub fn select_from_cache(key: &str) -> String {
  let (value, date) = get_value(key);
  if date == "" {
    return String::from("");
  } else {
    let date_as_seconds = date.parse::<f64>().unwrap_or(0.0);
    let now_as_seconds = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_secs_f64();

    let last_updated_secs = now_as_seconds - date_as_seconds;

    if last_updated_secs > CACHE_TIMEOUT_SECS {
      println!(
        "[DB] Cache invalidated, last updated {}s ago",
        last_updated_secs as u64
      );
      return String::from("");
    } else {
      println!(
        "[DB] Using cache value, last updated {}s ago",
        last_updated_secs as u64
      );
      return value;
    }
  }
}

pub fn insert_into_cache(key: &str, value: &str) {
  set_value(key, value);
}
