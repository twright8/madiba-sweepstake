/* ============================================================
   fixtures.jsx — Calendar, Group Tables, Bracket, live sync
   ============================================================ */

/* ---- knockout-aware code resolver (recursive, memo-guarded) ---- */
function resolveCode(slot, seen) {
  if (!slot) return null;
  if (WC.TEAM_BY_CODE[slot]) return slot;
  seen = seen || new Set();
  if (seen.has(slot)) return null;
  seen.add(slot);
  // group winner / runner-up
  if (/^[12][A-L]$/.test(slot)) {
    const pos = slot[0] === "1" ? 0 : 1, gp = slot[1];
    const complete = WC.GROUP_FIXTURES.filter(f => f.group === gp).every(f => Store.getScore(f.id));
    if (complete) { const tbl = Store.groupTable(gp); if (tbl[pos]) return tbl[pos].code; }
    return null;
  }
  // winner/loser of a knockout match
  const m = /^([WL])(\d+)$/.exec(slot);
  if (m) {
    const num = +m[2];
    const w = Store.state.koTeams["W" + num], l = Store.state.koTeams["L" + num];
    return m[1] === "W" ? (w || null) : (l || null);
  }
  // manual placeholder (third places etc.)
  return Store.state.koTeams[slot] || null;
}
function sideSlot(f, side) {
  const raw = side === "home" ? f.home : f.away;
  return raw === "3?" ? "3Q" + f.num : raw;
}

/* ============================ CALENDAR ============================ */
function Calendar() {
  const [, force] = useState(0);
  const [mineOnly, setMineOnly] = useState(false);
  const [sync, setSync] = useState({ state: "idle", msg: "" });
  const drawDone = Store.state.draw.done;
  const owners = Store.state.draw.owners || {};

  async function doSync() {
    setSync({ state: "loading", msg: "Reaching the live feed…" });
    try {
      const r = await Store.syncLive();
      setSync({ state: "ok", msg: `Synced — ${r.updated} result(s) pulled in.` });
      force(x => x + 1);
    } catch (e) {
      setSync({ state: "err", msg: "Couldn't reach the live feed (works once it's deployed online). Pop scores in by hand below." });
    }
  }

  let list = WC.FIXTURES.map(f => ({ f, h: resolveCode(sideSlot(f, "home")), a: resolveCode(sideSlot(f, "away")) }));
  if (mineOnly && drawDone) list = list.filter(x => (x.h && owners[x.h]) || (x.a && owners[x.a]));

  // group by SAST day
  const days = [];
  const map = {};
  list.forEach(x => {
    const k = dayKey(x.f.kickoff);
    if (!map[k]) { map[k] = { key: k, iso: x.f.kickoff, items: [] }; days.push(map[k]); }
    map[k].items.push(x);
  });

  return (
    <div className="wrap grid" style={{ gap: 14, paddingTop: 16 }}>
      <div className="between" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 30 }}>Fixtures</h1>
          <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>All times SAST. Yes, some are at 04:00. Set an alarm or don't.</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {drawDone && (
            <button className={"btn sm " + (mineOnly ? "green" : "")} onClick={() => setMineOnly(m => !m)}>
              {mineOnly ? "✓ Owned teams" : "Owned teams"}
            </button>
          )}
          {window.HOST && (
            <button className="btn gold sm" onClick={doSync} disabled={sync.state === "loading"}>
              {sync.state === "loading" ? "Syncing…" : "⟳ Live scores"}
            </button>
          )}
        </div>
      </div>

      {sync.state !== "idle" && (
        <div className="card flat" style={{ padding: "10px 14px", borderColor: sync.state === "err" ? "var(--red)" : "var(--ink)", background: sync.state === "ok" ? "#e7f5ec" : sync.state === "err" ? "#fdecea" : "#fff" }}>
          <b style={{ fontSize: 14 }}>{sync.msg}</b>
          {Store.state.lastSync && sync.state === "ok" && <span className="muted" style={{ fontSize: 12 }}> · last sync {fmtTime(Store.state.lastSync)}</span>}
        </div>
      )}

      {days.map(day => (
        <div key={day.key} className="grid" style={{ gap: 8 }}>
          <div className="row" style={{ gap: 10, marginTop: 4 }}>
            <span className="tag-stage">{fmtDayLong(day.iso)}</span>
            <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>{day.items.length} match{day.items.length > 1 ? "es" : ""}</span>
          </div>
          {day.items.map(x => <FixtureRow key={x.f.id} x={x} owners={owners} onChange={() => force(v => v + 1)} />)}
        </div>
      ))}
    </div>
  );
}

function FixtureRow({ x, owners, onChange }) {
  const { f, h, a } = x;
  const s = Store.getScore(f.id);
  const isGroup = f.stage === "group";
  const stage = f.group ? "Grp " + f.group : WC.STAGE_LABEL[f.stage];
  const done = !!s;

  function setH(v) { Store.setScore(f.id, v, s ? s.a : (v === "" ? "" : 0)); onChange(); }
  function setA(v) { Store.setScore(f.id, s ? s.h : (v === "" ? "" : 0), v); onChange(); }

  return (
    <div className="card flat" style={{ padding: "10px 12px" }}>
      <div className="row" style={{ gap: 8 }}>
        <div style={{ width: 52, flex: "0 0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 15 }}>{fmtTime(f.kickoff)}</div>
          <div className="muted" style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{stage}</div>
        </div>
        <FxSide code={h} raw={sideSlot(f, "home")} owner={owners[h]} />
        {isGroup && window.HOST ? (
          <div className="row" style={{ gap: 4, flex: "0 0 auto" }}>
            <input className="scorebox" type="number" min="0" value={s ? s.h : ""} placeholder="–" onChange={e => setH(e.target.value)} />
            <input className="scorebox" type="number" min="0" value={s ? s.a : ""} placeholder="–" onChange={e => setA(e.target.value)} />
          </div>
        ) : (
          <div style={{ flex: "0 0 auto", textAlign: "center", fontFamily: "var(--display)", fontSize: 20, minWidth: 42 }}>
            {s ? `${s.h}–${s.a}` : "v"}
          </div>
        )}
        <FxSide code={a} raw={sideSlot(f, "away")} owner={owners[a]} right />
      </div>
    </div>
  );
}
function FxSide({ code, raw, owner, right }) {
  const t = code && WC.TEAM_BY_CODE[code];
  const p = owner && WC.PEOPLE.find(x => x.id === owner);
  const label = t ? t.name : slotLabel(raw);
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: right ? "right" : "left" }}>
      <div className="row" style={{ gap: 7, justifyContent: right ? "flex-end" : "flex-start" }}>
        {!right && <span style={{ fontSize: 22 }}>{t ? <Flag code={code} size={20} /> : "•"}</span>}
        <span style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        {right && <span style={{ fontSize: 22 }}>{t ? <Flag code={code} size={20} /> : "•"}</span>}
      </div>
      {p && <div style={{ fontSize: 11, fontWeight: 800, color: "var(--blue)" }}>{p.emoji} {p.name}</div>}
    </div>
  );
}
function slotLabel(raw) {
  if (!raw) return "TBC";
  if (/^1[A-L]$/.test(raw)) return "Winner " + raw[1];
  if (/^2[A-L]$/.test(raw)) return "2nd " + raw[1];
  if (/^3/.test(raw)) return "3rd place";
  const m = /^([WL])(\d+)$/.exec(raw);
  if (m) return (m[1] === "W" ? "Winner #" : "Loser #") + m[2];
  return "TBC";
}

/* ============================ GROUP TABLES ============================ */
function Standings() {
  const [tab, setTab] = useState(Store.state.draw.done ? "race" : "groups");
  return (
    <div className="wrap grid" style={{ gap: 14, paddingTop: 16 }}>
      <div className="between" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 30 }}>Standings</h1>
          <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>Who's furthest, the group tables, and the bracket.</p>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          <button className={"btn sm " + (tab === "race" ? "green" : "")} onClick={() => setTab("race")}>🏆 Race</button>
          <button className={"btn sm " + (tab === "groups" ? "green" : "")} onClick={() => setTab("groups")}>Groups</button>
          <button className={"btn sm " + (tab === "bracket" ? "green" : "")} onClick={() => setTab("bracket")}>Knockout</button>
        </div>
      </div>
      {tab === "race"
        ? (Store.state.draw.done
            ? <div className="grid" style={{ gap: 16 }}>
                <RaceBoard pot="pick" />
                <RaceBoard pot="dip" />
              </div>
            : <EmptyState title="No races yet" msg="Once the draw is done, the two races — Pick Pot and Dip Pot — show up here." />)
        : tab === "groups" ? <GroupTables /> : <Bracket />}
    </div>
  );
}

function GroupTables() {
  const owners = Store.state.draw.owners || {};
  const thirds = Store.thirdPlaceRanking().slice(0, 8).map(x => x.group);
  return (
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: 14 }}>
      {WC.GROUPS.map(gp => {
        const rows = Store.groupTable(gp);
        const played = WC.GROUP_FIXTURES.filter(f => f.group === gp && Store.getScore(f.id)).length;
        return (
          <div key={gp} className="card flat">
            <div className="between" style={{ padding: "10px 14px 6px" }}>
              <div className="section-title"><span className="dot" />Group {gp}</div>
              <span className="muted" style={{ fontSize: 11, fontWeight: 800 }}>{played}/6 played</span>
            </div>
            <div className="zig" style={{ height: 8, borderWidth: 2 }} />
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "right", color: "#7a7059", fontSize: 10, textTransform: "uppercase" }}>
                  <th style={{ textAlign: "left", padding: "6px 10px" }}>Team</th>
                  <th>P</th><th>GD</th><th style={{ paddingRight: 10 }}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const t = WC.TEAM_BY_CODE[r.code];
                  const p = owners[r.code] && WC.PEOPLE.find(x => x.id === owners[r.code]);
                  const through = i < 2 || (i === 2 && thirds.includes(gp));
                  return (
                    <tr key={r.code} style={{ borderTop: "1.5px solid #efe4cb", background: i < 2 ? "rgba(0,122,77,.07)" : i === 2 && thirds.includes(gp) ? "rgba(255,184,28,.14)" : "transparent" }}>
                      <td style={{ padding: "7px 10px" }}>
                        <div className="row" style={{ gap: 7 }}>
                          <span style={{ width: 16, textAlign: "center", fontWeight: 900, color: through ? "var(--green)" : "#bcae90" }}>{i + 1}</span>
                          <span style={{ fontSize: 17 }}><Flag code={r.code} size={16} /></span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, whiteSpace: "nowrap" }}>{t.name}</div>
                            {p && <div style={{ fontSize: 10, fontWeight: 800, color: "var(--blue)" }}>{p.emoji} {p.name}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>{r.P}</td>
                      <td style={{ textAlign: "right" }}>{r.GD > 0 ? "+" + r.GD : r.GD}</td>
                      <td style={{ textAlign: "right", paddingRight: 10, fontFamily: "var(--display)", fontSize: 16 }}>{r.Pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
      <p className="muted" style={{ gridColumn: "1/-1", fontSize: 12, margin: 0 }}>
        <span className="pill" style={{ background: "rgba(0,122,77,.15)", fontSize: 10 }}>Top 2</span> auto-qualify ·
        <span className="pill" style={{ background: "rgba(255,184,28,.3)", fontSize: 10, marginLeft: 6 }}>Best 8 third places</span> also go through. Highlights update as you enter scores.
      </p>
    </div>
  );
}

/* ============================ BRACKET ============================ */
function Bracket() {
  const [, force] = useState(0);
  const rounds = [
    ["R32", "Round of 32"], ["R16", "Round of 16"], ["QF", "Quarter-finals"],
    ["SF", "Semi-finals"], ["FINAL", "Final"], ["3RD", "Third place"],
  ];
  return (
    <div className="grid" style={{ gap: 16 }}>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        Group winners & runners-up fill in automatically once a group's six games are scored. For the third-place slots and each knockout result, just <b>tap the team that went through</b>.
      </p>
      {rounds.map(([code, label]) => (
        <div key={code} className="grid" style={{ gap: 8 }}>
          <div className="section-title"><span className="dot" />{label}</div>
          <div className="grid" style={{ gridTemplateColumns: code === "FINAL" || code === "3RD" || code === "SF" ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
            {WC.FIXTURES.filter(f => f.stage === code).map(f => <KOMatch key={f.id} f={f} onChange={() => force(v => v + 1)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function KOMatch({ f, onChange }) {
  const owners = Store.state.draw.owners || {};
  const hSlot = sideSlot(f, "home"), aSlot = sideSlot(f, "away");
  const h = resolveCode(hSlot), a = resolveCode(aSlot);
  const winner = Store.state.koTeams["W" + f.num];

  function pick(code, otherCode) {
    if (!code) return;
    if (winner === code) { // undo
      Store.setKoTeam("W" + f.num, null); Store.setKoTeam("L" + f.num, null);
    } else {
      Store.setKoTeam("W" + f.num, code);
      if (otherCode) Store.setKoTeam("L" + f.num, otherCode);
    }
    onChange();
  }
  function assign(slot, code) { Store.setKoTeam(slot, code || null); onChange(); }

  return (
    <div className="card flat" style={{ padding: "8px 10px" }}>
      <div className="muted" style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", padding: "2px 2px 6px" }}>
        #{f.num} · {fmtDay(f.kickoff)} · {f.city}
      </div>
      <KOSide f={f} slot={hSlot} code={h} owner={owners[h]} winner={winner} onPick={() => pick(h, a)} onAssign={assign} />
      <KOSide f={f} slot={aSlot} code={a} owner={owners[a]} winner={winner} onPick={() => pick(a, h)} onAssign={assign} />
    </div>
  );
}
function KOSide({ slot, code, owner, winner, onPick, onAssign }) {
  const host = !!window.HOST;
  const t = code && WC.TEAM_BY_CODE[code];
  const p = owner && WC.PEOPLE.find(x => x.id === owner);
  const isWinner = winner && code === winner;
  const needsAssign = !t && /^3Q/.test(slot) && host;
  return (
    <div className="between" style={{
      padding: "7px 8px", borderRadius: 9, marginBottom: 4,
      background: isWinner ? "var(--green)" : "rgba(0,0,0,.03)",
      color: isWinner ? "#fff" : "var(--ink)",
      opacity: winner && !isWinner ? .45 : 1, cursor: (t && host) ? "pointer" : "default",
    }} onClick={(t && host) ? onPick : undefined}>
      <div className="row" style={{ gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 20 }}>{t ? <Flag code={code} size={20} /> : "•"}</span>
        {needsAssign ? (
          <select value="" onChange={e => onAssign(slot, e.target.value)} onClick={e => e.stopPropagation()}
            style={{ fontWeight: 800, border: "2px solid var(--ink)", borderRadius: 8, padding: "3px 6px", background: "#fff", maxWidth: 150 }}>
            <option value="">3rd place — choose…</option>
            {WC.TEAMS.map(tm => <option key={tm.code} value={tm.code}>{tm.name}</option>)}
          </select>
        ) : (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t ? t.name : slotLabel(slot)}</div>
            {p && <div style={{ fontSize: 10, fontWeight: 800, color: isWinner ? "#ffe9b0" : "var(--blue)" }}>{p.emoji} {p.name}</div>}
          </div>
        )}
      </div>
      {isWinner && <span style={{ fontWeight: 900, fontSize: 12 }}>✓</span>}
    </div>
  );
}

Object.assign(window, { Calendar, Standings, GroupTables, Bracket, resolveCode });
