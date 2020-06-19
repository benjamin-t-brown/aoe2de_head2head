extern crate actix_web;
use actix_web::{App, HttpServer};
use actix_files as fs;
use crate::endpoints::*;

#[actix_rt::main]
pub async fn listen() -> std::io::Result<()> {
  let port: i32 = match std::env::var("PORT") {
    Ok(port) => port.parse().unwrap(),
    Err(_) => 3030,
  };

  let addr = format!("0.0.0.0:{}", port);

  println!("[SRV] Listening on: {}", addr);
  HttpServer::new(|| {
    App::new()
      .service(index)
      .service(fs::Files::new("/public", "ui/public").index_file("index.html"))
      .service(fs::Files::new("/static/js", "ui/build/static/js").index_file("index.html"))
      .service(fs::Files::new("/static", "ui/build").index_file("index.html"))
      .service(lookup_player)
  })
  .bind(addr)?
  .run()
  .await
}
