# HaxBall 3v3 Pro Room

Professional HaxBall room with ELO ranking, commentary, custom map.

## Deploy on Render

1. Push this repo to GitHub
2. New Web Service on Render → connect repo
3. Environment: Docker
4. Add env variable: HAXBALL_TOKEN = your token from haxball.com/headlesstoken
5. Deploy!

## Player Commands
- `!elo` — your ELO and rank
- `!stats` — full stats
- `!top5` — leaderboard
- `!score` — current score
- `!help` — all commands

## Admin Commands
- `!start` / `!stop`
- `!balance` — auto balance teams by ELO
- `!kick [name]` / `!ban [name]`
