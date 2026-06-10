# Madiba Magic — World Cup 2026 Family Sweepstake

A live, single-page web app for a 9-person family sweepstake. Nine players, 48 teams.
Everyone gets **two teams** — one they **pick themselves** in the Pot 1 draft, one **random**
from Pot 2 — and the winner is **whoever's team goes furthest** in the tournament.

The draw is **remote and live**: when it's your turn you open the link on your own phone and
pick your team; everyone else sees it update instantly. State is shared live via **Firebase
Realtime Database** — no logins for the family, nothing to republish.

## Links

| Link | Who | Can do |
|------|-----|--------|
| `https://twright8.github.io/madiba-sweepstake/` | Everyone | View, and pick their own team when it's their turn |
| `https://twright8.github.io/madiba-sweepstake/?host` | **Tom (host)** | Start/lock the draw, enter scores, tap knockout winners |

## One-time setup (host) — connect Firebase

This is the only setup, ~10 minutes, done once:

1. Go to <https://console.firebase.google.com> → **Add project** → name it `madiba-sweepstake`
   → you can disable Google Analytics → **Create project**.
2. In the left menu: **Build → Realtime Database → Create Database** → pick a location →
   start in **test mode** → Enable.
3. Open the **Rules** tab of the Realtime Database, replace with this and **Publish**:
   ```json
   { "rules": { ".read": true, ".write": true } }
   ```
4. Click the **gear ⚙ → Project settings → Your apps → Web (`</>`)** → register an app
   (any nickname) → copy the **`firebaseConfig`** object it shows (apiKey, databaseURL, etc.).
5. Paste that config into **`firebase-config.js`** (between the braces), commit, and push.

The crucial field is **`databaseURL`** (e.g. `https://madiba-sweepstake-default-rtdb.firebaseio.com`).
If it's missing from the snippet, create the Realtime Database first (step 2), then re-copy the config.

> Until Firebase is configured the app still runs, but in single-device mode (phones don't sync).

## Running the draw

1. You open **`?host`** → **Draw → Roll the pick order**.
2. Text each person, in order, "you're up". They open the normal link → **Draw** → pick their team.
3. Pot 2 the same — each person taps once for a random team.
4. When everyone's in, you hit **🔒 Lock the draw**. Done — it's live for all.

(If someone's not around, you can pick for them with **🎲 Pick for me**.)

## During the tournament

You (`?host`) enter group scores and tap knockout winners — everyone sees it live, instantly.
No publishing, no files. There's also a **⟳ Live scores** button on Fixtures that pulls results
from a free feed.

## Files

- `index.html` — page shell (fonts, React/Babel, Firebase, then the app).
- `firebase-config.js` — **paste your Firebase config here**.
- `styles.css` — the South African poster styling.
- `data.js` — players, 48 teams, full fixture schedule.
- `store.js` — live shared state, draw logic, standings, the "furthest wins" race.
- `components.jsx`, `leaderboard.jsx`, `draw.jsx`, `screens.jsx`, `fixtures.jsx`, `app.jsx` — the UI.
- `state.json` — seed/fallback used only when Firebase isn't configured.
