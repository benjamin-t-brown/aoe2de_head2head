// build.rs

use std::process::Command;
// use std::env;
// use std::path::Path;

fn main() {
  println!("cargo build-ui");
  Command::new("yarn").current_dir("./ui").status().unwrap();
  Command::new("yarn")
    .args(&["build"])
    .current_dir("./ui")
    .status()
    .unwrap();
}
