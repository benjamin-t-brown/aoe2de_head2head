# AOE2: DE Head2Head

This is a command line app that uses the aoe2.net api to lookup a user by team ranking and output their win/loss records vs other players.

Live version at [aoe2de-head2head.herokuapp.com/](https://aoe2de-head2head.herokuapp.com/)

## Features
- Outputs a csv of player matchup information (wins and losses)
- Shows the team elo of all players in the most recent (including current) game being played

## Requires

Rust toolchain (cargo, rustc, etc.)
Yarn + Nodejs 10.16 (for ui)

## Usage
*Server*

```
    cargo run
```

*Command line*

```
    cargo run "<playerName>"
```

This outputs info on the most recent game and a csv of win/loss records (team games)

The header of the csv is this:

```profile_id,player_name,wins_against,losses_to,elo,date_last_played```

## Example

```
    $ cargo run minjammben
      Compiling head2head v0.1.0 (/mnt/d/progs/aoe2de_head2head)
        Finished dev [unoptimized + debuginfo] target(s) in 4.14s
        Running `target/debug/head2head minjammben`
    Program started
    Lookup: 'minjammben'
    https://aoe2.net/api/leaderboard?start=1&leaderboard_id=4&search=minjammben
    Get match history for id: '314433'
    https://aoe2.net/api/player/matches?game=aoe2de&start=0&count=999&profile_id=314433
    Retaining match history: 162 games
    Processing match history: 157 games

    Most recent game: 2020-05-13 05:40:53

    Rating in recent game: 1885
    Rating now: 1876

    Game is complete! (most likely) rating_now=1876 rating_in_game=1885

    Minjammben:(elo=1876)
    Teammates: CrookedYams:(elo=1888) DancePartyGirl:(elo=1888) DoorknobsMcgee:(elo=1583)
    ---
    Played against -> Babooshka:(elo=1850) Shadows:(elo=2030) [KM] chaulauque:(elo=1994) [KM]_ChilenoRoX:(elo=1971)
    Babooshka: wins against 3, losses to 1
    Shadows: wins against 0, losses to 1
    [KM] chaulauque: wins against 0, losses to 1
    [KM]_ChilenoRoX: wins against 0, losses to 1

    writing... /mnt/d/progs/aoe2de_head2head/Minjammben_output.csv
```
