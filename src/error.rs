extern crate reqwest;

#[derive(Clone, Debug)]
pub struct RuntimeError {
  message: String,
}

impl RuntimeError {
  pub fn new(msg: &str) -> RuntimeError {
    RuntimeError {
      message: msg.to_string(),
    }
  }
}

impl std::fmt::Display for RuntimeError {
  fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
    write!(f, "{}", self.message)
  }
}

impl std::error::Error for RuntimeError {
  fn description(&self) -> &str {
    &self.message
  }
}

impl From<reqwest::Error> for RuntimeError {
  fn from(error: reqwest::Error) -> Self {
    RuntimeError {
      message: error.to_string(),
    }
  }
}

impl From<std::io::Error> for RuntimeError {
  fn from(error: std::io::Error) -> Self {
    RuntimeError {
      message: error.to_string(),
    }
  }
}
