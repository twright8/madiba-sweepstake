# Madiba Magic — World Cup 2026 Family Sweepstake

A single-page web app for a 9-person family sweepstake. Nine players, 48 teams.
Everyone gets **two teams** — one they pick in the Pot 1 draft, one random from Pot 2 —
and the winner is **whoever's team goes furthest** in the tournament.

It's a static site (no server, no database). The shared state — the locked draw and
all scores — lives in **`state.json`**, which everyone's browser reads. Group results
also auto-update from a live feed, so standings move on their own between publishes.

## Two ways to open it

| Link | Who | Can do |
|------|-----|--------|
| `https://<your-pages-url>/` | The whole family | View everything (read-only). Draw is locked. |
| `https://<your-pages-url>/?host` | **You (the host)** | Run the draw, edit scores, tap knockout winners, **Publish**. |

Bookmark the **`?host`** link for yourself. Send everyone else the plain link.

## Running the draw (do this once)

1. Open the **`?host`** link.
2. Go to **Draw** → roll the pick order → each person picks their Pot 1 team in turn →
   then each taps once for their Pot 2 random team.
3. When it's done, hit **🔒 Lock & publish this draw**.
4. **Download** the `state.json` it gives you, drop it into this folder (replacing the old
   one), and run `./publish.sh`. Within a minute everyone sees the locked draw.

## Updating during the tournament

- **Group scores** auto-pull from the live feed for everyone — usually nothing to do.
- For **knockout winners**, hand-fixed scores, or "who's paid", make the change on the
  `?host` link, hit **⬆ Publish**, save `state.json` here, and run `./publish.sh`.

```bash
./publish.sh
```

## Files

- `index.html` — page shell (loads fonts, React/Babel, then the app).
- `styles.css` — the South African poster styling.
- `data.js` — players, 48 teams, full fixture schedule.
- `store.js` — state, draw logic, standings, the "furthest wins" race, publishing.
- `components.jsx`, `leaderboard.jsx`, `draw.jsx`, `screens.jsx`, `fixtures.jsx`, `app.jsx` — the UI.
- `state.json` — the shared, published state (the one thing you republish).
- `publish.sh` — commit + push helper.
