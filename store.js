/* ============================================================
   store.js — state, persistence, draw logic, standings, live sync
   Plain JS. Exposes window.Store with a tiny pub/sub.
   ============================================================ */
(function () {
  const { PEOPLE, CONFIG, TEAMS, TEAM_BY_CODE, GROUPS, FIXTURES, GROUP_FIXTURES } = window.WC;
  const KEY = "madiba_sweep_v1";

  const HOST = !!window.HOST;          // host edits scores/results + starts/locks the draw
  const DB = window.SWEEP_DB || null;  // Firebase ref('sweep'), or null = single-device fallback

  const defaultState = () => ({
    config: { buyIn: CONFIG.buyIn, currency: CONFIG.currency },
    paid: {},                 // personId -> bool
    draw: {
      done: false,
      locked: false,          // once locked, the draw can't be re-rolled
      order: [],              // array of personId in pot-1 pick order
      pot1: {},               // personId -> [teamCode]
      pot2: {},               // personId -> [teamCode]
      owners: {},             // teamCode -> personId (final, all teams)
    },
    scores: {},               // fixtureId -> {h:Number,a:Number} (manual or synced)
    koTeams: {},              // slot label ("W74","3?#79") -> teamCode (host assigns knockouts)
    lastSync: null,
  });

  let ready = !DB;            // single-device mode is ready immediately; Firebase waits for first snapshot
  let state = DB ? defaultState() : load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {}
    return defaultState();
  }

  // a clean, Firebase-safe copy of the shared state (no functions, no transient fields)
  function snapshot() {
    return {
      config: state.config || {},
      paid: state.paid || {},
      draw: {
        done: !!state.draw.done, locked: !!state.draw.locked,
        order: state.draw.order || [],
        pot1: state.draw.pot1 || {}, pot2: state.draw.pot2 || {},
        owners: state.draw.owners || {},
      },
      scores: state.scores || {},
      koTeams: state.koTeams || {},
    };
  }
  // merge a server/seed value over the defaults (Firebase drops empty objects/arrays)
  function applyServer(v) {
    const d = defaultState();
    state = {
      config: Object.assign(d.config, v.config || {}),
      paid: v.paid || {},
      draw: Object.assign(d.draw, v.draw || {}),
      scores: v.scores || {},
      koTeams: v.koTeams || {},
      lastSync: state.lastSync || null,
    };
    state.draw.order = state.draw.order || [];
    state.draw.pot1 = state.draw.pot1 || {};
    state.draw.pot2 = state.draw.pot2 || {};
    state.draw.owners = state.draw.owners || {};
  }

  function save() {
    if (DB) {
      if (ready) { try { DB.set(snapshot()); } catch (e) { console.warn("[sweep] write failed", e && e.message); } }
    } else if (HOST) {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }
    emit();
  }

  // ---- Firebase live subscription ----
  if (DB) {
    DB.on("value", function (snap) {
      const v = snap.val();
      if (v) applyServer(v);
      else if (HOST) { try { DB.set(snapshot()); } catch (e) {} }  // seed the empty node once
      ready = true;
      emit();
    }, function (err) {
      console.warn("[sweep] db read error:", err && err.message);
      ready = true; emit();
    });
  }

  // single-device fallback: seed from a committed state.json (no-op in Firebase mode)
  function hydrate(json) {
    if (DB) { emit(); return; }
    if (json && typeof json === "object") applyServer(json);
    emit();
  }
  function exportState() { return JSON.stringify(snapshot(), null, 2); }
  function lockDraw() { state.draw.locked = true; save(); }
  function isHost() { return HOST; }
  function isReady() { return ready; }
  function isLive() { return !!DB; }

  /* ---- pub/sub ---- */
  const subs = new Set();
  function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
  function emit() { subs.forEach(fn => fn()); }

  /* ---- helpers ---- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---- DRAW ---- */
  function rollOrder() {
    state.draw.order = shuffle(PEOPLE.map(p => p.id));
    state.draw.pot1 = {};
    state.draw.pot2 = {};
    state.draw.owners = {};
    state.draw.done = false;
    PEOPLE.forEach(p => { state.draw.pot1[p.id] = []; state.draw.pot2[p.id] = []; });
    save();
  }
  // teams not yet taken in pot 1
  function availablePot1() {
    const taken = new Set();
    Object.values(state.draw.pot1).forEach(list => list.forEach(c => taken.add(c)));
    return TEAMS.filter(t => !taken.has(t.code));
  }
  function pot1Pick(personId, code) {
    if (!state.draw.pot1[personId]) state.draw.pot1[personId] = [];
    state.draw.pot1[personId].push(code);
    save();
  }
  function pot1RandomFor(personId) {
    const avail = availablePot1();
    const pick = avail[Math.floor(Math.random() * avail.length)];
    pot1Pick(personId, pick.code);
    return pick;
  }
  // ---- Pot 2: click-to-reveal, one random team at a time, persisted ----
  function assignedCodes() {
    const s = new Set();
    Object.values(state.draw.pot1).forEach(l => l.forEach(c => s.add(c)));
    Object.values(state.draw.pot2).forEach(l => l.forEach(c => s.add(c)));
    return s;
  }
  function availablePot2() {
    const taken = assignedCodes();
    return TEAMS.filter(t => !taken.has(t.code));
  }
  function pot2Target() { return CONFIG.teamsPerPerson - CONFIG.pot1Picks; } // 5
  function finalizeOwners() {
    state.draw.owners = {};
    PEOPLE.forEach(p => {
      [...(state.draw.pot1[p.id] || []), ...(state.draw.pot2[p.id] || [])]
        .forEach(c => state.draw.owners[c] = p.id);
    });
  }
  function pot2RandomFor(personId) {
    if (!state.draw.pot2[personId]) state.draw.pot2[personId] = [];
    if (state.draw.pot2[personId].length >= pot2Target()) return null;
    const avail = availablePot2();
    if (!avail.length) return null;
    const pick = avail[Math.floor(Math.random() * avail.length)];
    state.draw.pot2[personId].push(pick.code);
    finalizeOwners();
    const total = Object.values(state.draw.pot2).reduce((n, l) => n + l.length, 0);
    if (total >= PEOPLE.length * pot2Target()) state.draw.done = true;
    save();
    return pick;
  }
  function pot2FillFor(personId) {
    let last = null;
    while ((state.draw.pot2[personId] || []).length < pot2Target()) last = pot2RandomFor(personId);
    return last;
  }
  function drawComplete() { return state.draw.done; }
  function resetDraw() {
    state.draw = defaultState().draw;
    save();
  }
  function teamsOf(personId) {
    return [...(state.draw.pot1[personId] || []), ...(state.draw.pot2[personId] || [])]
      .map(c => TEAM_BY_CODE[c]);
  }
  function ownerOf(code) { return state.draw.owners[code]; }
  function personById(id) { return PEOPLE.find(p => p.id === id); }

  /* ---- MONEY ---- */
  function togglePaid(id) { state.paid[id] = !state.paid[id]; save(); }
  function setBuyIn(v) { state.config.buyIn = Math.max(0, Number(v) || 0); save(); }
  function potTotal() { return PEOPLE.length * (state.config.buyIn || 0); }
  function collected() { return PEOPLE.filter(p => state.paid[p.id]).length * (state.config.buyIn || 0); }

  /* ---- SCORES ---- */
  function setScore(fixtureId, h, a) {
    if (h === "" && a === "") { delete state.scores[fixtureId]; }
    else state.scores[fixtureId] = { h: Number(h), a: Number(a) };
    save();
  }
  function getScore(fixtureId) { return state.scores[fixtureId]; }
  function clearScores() { state.scores = {}; save(); }

  /* ---- GROUP STANDINGS ---- */
  function blankRow(code) {
    return { code, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 };
  }
  function groupTable(group) {
    const rows = {};
    TEAMS.filter(t => t.group === group).forEach(t => rows[t.code] = blankRow(t.code));
    GROUP_FIXTURES.filter(f => f.group === group).forEach(f => {
      const s = state.scores[f.id];
      if (!s) return;
      const H = rows[f.home], A = rows[f.away];
      H.P++; A.P++; H.GF += s.h; H.GA += s.a; A.GF += s.a; A.GA += s.h;
      if (s.h > s.a) { H.W++; A.L++; H.Pts += 3; }
      else if (s.h < s.a) { A.W++; H.L++; A.Pts += 3; }
      else { H.D++; A.D++; H.Pts++; A.Pts++; }
    });
    return Object.values(rows).map(r => (r.GD = r.GF - r.GA, r))
      .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF ||
        TEAM_BY_CODE[a.code].name.localeCompare(TEAM_BY_CODE[b.code].name));
  }
  // best-8 third-placed teams across all groups
  function thirdPlaceRanking() {
    const thirds = GROUPS.map(gp => ({ group: gp, row: groupTable(gp)[2] }))
      .filter(x => x.row && x.row.P > 0);
    thirds.sort((a, b) => b.row.Pts - a.row.Pts || b.row.GD - a.row.GD || b.row.GF - a.row.GF);
    return thirds;
  }

  /* ---- alive / eliminated ----
     A team is eliminated if: group complete and it finished below 2nd and not a best-8 third,
     OR it lost a knockout match (handled via koTeams losers). Simplified + honest. */
  function teamStatus(code) {
    const t = TEAM_BY_CODE[code];
    const table = groupTable(t.group);
    const complete = GROUP_FIXTURES.filter(f => f.group === t.group).every(f => state.scores[f.id]);
    const pos = table.findIndex(r => r.code === code) + 1;
    if (!complete) return { state: "playing", note: "Group stage" };
    if (pos <= 2) return { state: "alive", note: `Through (#${pos} in ${t.group})` };
    if (pos === 3) {
      const best8 = thirdPlaceRanking().slice(0, 8).map(x => x.group);
      if (best8.includes(t.group)) return { state: "alive", note: "Through (best 3rd)" };
      return { state: "out", note: "Out (3rd, missed cut)" };
    }
    return { state: "out", note: `Out (#${pos} in ${t.group})` };
  }

  /* ---- KNOCKOUT slot resolution (host enters teams) ---- */
  function setKoTeam(slot, code) {
    if (!code) delete state.koTeams[slot]; else state.koTeams[slot] = code;
    save();
  }
  function resolveSlot(slot) {
    // group winner/runner auto from tables if complete
    if (/^[12][A-L]$/.test(slot)) {
      const pos = slot[0] === "1" ? 0 : 1;
      const table = groupTable(slot[1]);
      const complete = GROUP_FIXTURES.filter(f => f.group === slot[1]).every(f => state.scores[f.id]);
      if (complete && table[pos]) return table[pos].code;
    }
    return state.koTeams[slot] || null;
  }

  /* ---- TOURNAMENT PROGRESS / THE RACE ----
     Each person owns 2 teams; the winner is whoever's BEST team goes furthest.
     Levels: 0 group-out · 1 R32 · 2 R16 · 3 QF · 4 SF · 5 Final (runner-up) · 6 Champions */
  const KO_STAGES = ["R32", "R16", "QF", "SF", "FINAL"];
  const LEVEL_LABEL = {
    0: "Group stage", 1: "Reached Round of 32", 2: "Reached Round of 16",
    3: "Reached Quarter-final", 4: "Reached Semi-final", 5: "Final — runner-up", 6: "Champions 🏆",
  };
  // self-contained slot resolver (handles team codes, 1A/2B, W##/L##, manual 3rd-place slots)
  function resolveAny(slot, seen) {
    if (!slot) return null;
    if (TEAM_BY_CODE[slot]) return slot;
    seen = seen || new Set();
    if (seen.has(slot)) return null;
    seen.add(slot);
    if (/^[12][A-L]$/.test(slot)) {
      const pos = slot[0] === "1" ? 0 : 1, gp = slot[1];
      const complete = GROUP_FIXTURES.filter(f => f.group === gp).every(f => state.scores[f.id]);
      if (complete) { const t = groupTable(gp); if (t[pos]) return t[pos].code; }
      return null;
    }
    return state.koTeams[slot] || null; // W##, L##, 3Q##, etc.
  }
  function koParticipant(f, side) {
    let raw = side === "home" ? f.home : f.away;
    if (raw === "3?") raw = "3Q" + f.num;
    return resolveAny(raw);
  }
  function champion() {
    const finalFx = FIXTURES.find(f => f.stage === "FINAL");
    if (!finalFx) return null;
    const w = state.koTeams["W" + finalFx.num];
    if (w) return w;
    // fall back to a decisive final score with resolved sides (e.g. from live sync)
    const s = state.scores[finalFx.id];
    if (s && s.h !== s.a) {
      const h = koParticipant(finalFx, "home"), a = koParticipant(finalFx, "away");
      if (h && a) return s.h > s.a ? h : a;
    }
    return null;
  }
  // a deterministic group-record score so the race always has an order (Pts, then GD, then GF)
  function tieKey(code) {
    if (!code) return -1;
    const t = TEAM_BY_CODE[code];
    if (!t) return -1;
    const row = groupTable(t.group).find(r => r.code === code);
    if (!row) return 0;
    return row.Pts * 10000 + (row.GD + 100) * 100 + row.GF;
  }
  function teamProgress(code) {
    if (!code) return { level: 0, label: "—" };
    if (champion() === code) return { level: 6, label: LEVEL_LABEL[6] };
    let level = 0;
    KO_STAGES.forEach((st, i) => {
      const fxs = FIXTURES.filter(f => f.stage === st);
      const inIt = fxs.some(f => koParticipant(f, "home") === code || koParticipant(f, "away") === code);
      if (inIt) level = i + 1;
    });
    if (level === 0) {
      const st = teamStatus(code);
      if (st.state === "alive") return { level: 1, label: LEVEL_LABEL[1] };
      if (st.state === "out") return { level: 0, label: st.note };
      return { level: 0, label: "Group stage", playing: true };
    }
    return { level, label: LEVEL_LABEL[level] };
  }
  // people ranked by their best team's progress (then group record as tie-break)
  function personRace() {
    const rows = PEOPLE.map(p => {
      const teams = teamsOf(p.id).filter(Boolean).map(t => ({ team: t, prog: teamProgress(t.code) }));
      teams.sort((a, b) => b.prog.level - a.prog.level || tieKey(b.team.code) - tieKey(a.team.code));
      const best = teams[0] || null;
      return { person: p, teams, best };
    });
    rows.sort((a, b) => {
      const lv = (b.best ? b.best.prog.level : 0) - (a.best ? a.best.prog.level : 0);
      if (lv) return lv;
      return (b.best ? tieKey(b.best.team.code) : -1) - (a.best ? tieKey(a.best.team.code) : -1);
    });
    return rows;
  }
  // true once a single champion (level 6) exists — the sweepstake is decided
  function raceDecided() { return !!champion(); }

  /* ---- LIVE SYNC (TheSportsDB free feed; only works online/deployed) ---- */
  const NAME_MAP = {
    "USA":"USA","United States":"USA","South Korea":"KOR","Korea Republic":"KOR",
    "Czech Republic":"CZE","Czechia":"CZE","Turkey":"TUR","Türkiye":"TUR","Turkiye":"TUR",
    "Bosnia and Herzegovina":"BIH","Bosnia & Herzegovina":"BIH","Ivory Coast":"CIV","Cote d'Ivoire":"CIV",
    "Cape Verde":"CPV","Cabo Verde":"CPV","DR Congo":"COD","Congo DR":"COD",
    "Curacao":"CUW","Curaçao":"CUW","Saudi Arabia":"KSA","New Zealand":"NZL",
  };
  function codeFromName(name) {
    if (!name) return null;
    if (NAME_MAP[name]) return NAME_MAP[name];
    const t = TEAMS.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (t) return t.code;
    const t2 = TEAMS.find(t => name.toLowerCase().includes(t.name.toLowerCase().split(" ")[0]));
    return t2 ? t2.code : null;
  }
  async function syncLive() {
    const url = "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Feed returned " + res.status);
    const data = await res.json();
    const events = (data && data.events) || [];
    let updated = 0;
    events.forEach(ev => {
      if (ev.intHomeScore == null || ev.intAwayScore == null) return;
      const hc = codeFromName(ev.strHomeTeam), ac = codeFromName(ev.strAwayTeam);
      if (!hc || !ac) return;
      const fx = FIXTURES.find(f => (f.home === hc && f.away === ac) || (f.home === ac && f.away === hc));
      if (!fx) return;
      const h = fx.home === hc ? Number(ev.intHomeScore) : Number(ev.intAwayScore);
      const a = fx.home === hc ? Number(ev.intAwayScore) : Number(ev.intHomeScore);
      state.scores[fx.id] = { h, a };
      updated++;
    });
    state.lastSync = new Date().toISOString();
    save();
    return { updated, total: events.length };
  }

  window.Store = {
    get state() { return state; },
    subscribe, save,
    // shared state / host
    hydrate, exportState, lockDraw, isHost, isReady, isLive,
    // draw
    rollOrder, availablePot1, pot1Pick, pot1RandomFor,
    availablePot2, pot2Target, pot2RandomFor, pot2FillFor, drawComplete, resetDraw,
    teamsOf, ownerOf, personById,
    // money
    togglePaid, setBuyIn, potTotal, collected,
    // scores + tables
    setScore, getScore, clearScores, groupTable, thirdPlaceRanking, teamStatus,
    // the race (furthest wins)
    teamProgress, personRace, champion, raceDecided,
    // ko
    setKoTeam, resolveSlot,
    // live
    syncLive,
  };
})();
