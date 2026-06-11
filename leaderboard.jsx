/* ============================================================
   leaderboard.jsx — the two races.
   Two independent contests, each with its own pot:
     🎯 Pick Pot — whose CHOSEN team (pot1) goes furthest
     🎲 Dip Pot  — whose RANDOM team (pot2) goes furthest
   You can win both, one, or neither. READ-ONLY on the draw.
   ============================================================ */

const POT_META = {
  pick: { emoji: "🎯", name: "Pick Pot", sub: "chosen teams", which: "pick" },
  dip:  { emoji: "🎲", name: "Dip Pot",  sub: "random teams", which: "dip" },
};

function levelStyle(level) {
  if (level >= 6) return { bg: "var(--gold)", fg: "var(--ink)", ic: "🏆" };
  if (level >= 4) return { bg: "var(--green)", fg: "#fff", ic: "🔥" };
  if (level >= 1) return { bg: "var(--blue)", fg: "#fff", ic: "✅" };
  return { bg: "#e7ddc6", fg: "var(--ink)", ic: "•" };
}
function ProgressPill({ prog, eliminated }) {
  if (eliminated) return <span className="pill grey" style={{ fontSize: 10 }}>❌ {prog.label}</span>;
  const s = levelStyle(prog.level);
  return <span className="pill" style={{ background: s.bg, color: s.fg, fontSize: 10 }}>{s.ic} {prog.label}</span>;
}

/* one team line in a race row */
function RaceTeam({ row, big }) {
  if (!row || !row.team) return <span className="muted">—</span>;
  return (
    <span className="teamline" style={{ opacity: row.eliminated ? 0.6 : 1, gap: 7 }}>
      <Flag code={row.code} size={big ? 20 : 16} />
      <span className="nm" style={{ fontWeight: 800, fontSize: big ? 15 : 13.5, textDecoration: row.eliminated ? "line-through" : "none" }}>{row.team.name}</span>
    </span>
  );
}

/* ---- one pot's full race board ---- */
function RaceBoard({ pot, goTo, compact }) {
  if (!Store.state.draw.done) return null;
  const meta = POT_META[pot];
  const cur = Store.state.config.currency;
  const amount = Store.potTotal();           // R500 per pot
  const rows = Store.raceByPot(pot);
  const winner = Store.potWinnerLocked(pot);
  const leader = winner || rows[0];
  const shown = compact ? rows.slice(0, 3) : rows;

  return (
    <div className="card">
      <span className="zig" />
      <div className="between" style={{ padding: "12px 16px 0", flexWrap: "wrap", gap: 8 }}>
        <div className="section-title"><span className="dot" />{meta.emoji} {meta.name}</div>
        <div className="row" style={{ gap: 8 }}>
          <span className="pill gold" style={{ fontSize: 12 }}>{cur}{amount}</span>
          {compact && <button className="btn sm" onClick={() => goTo && goTo("standings")}>Full race →</button>}
        </div>
      </div>

      {leader && leader.team && (
        <div className="card-pad" style={{ paddingBottom: 6 }}>
          <div className="row" style={{ gap: 12, background: "var(--gold)", border: "3px solid var(--ink)", borderRadius: 14, padding: "10px 14px", boxShadow: "var(--shadow-sm)" }}>
            <div className="ava" style={{ width: 46, height: 46, fontSize: 24 }}>{leader.person.emoji}</div>
            <div style={{ minWidth: 0 }}>
              <div className="kicker" style={{ color: "var(--ink)", opacity: .65 }}>{winner ? "🏆 Takes the pot" : "Leading right now"}</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase", lineHeight: 1 }}>{leader.person.name}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 2 }}>{leader.team.name} · {leader.prog.label}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "4px 12px 12px" }}>
        {shown.map((r, i) => (
          <div key={r.person.id} className="between"
            style={{ padding: "9px 6px", borderBottom: i < shown.length - 1 ? "2px dashed #e7ddc6" : "none", background: i === 0 ? "rgba(255,184,28,.12)" : "transparent", borderRadius: 8 }}>
            <div className="row" style={{ gap: 10, minWidth: 0 }}>
              <div className="hero-num" style={{ fontSize: 24, width: 24, textAlign: "center", color: i === 0 ? "var(--red)" : "#bcae90" }}>{i + 1}</div>
              <Ava id={r.person.id} sm />
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 15.5 }}>{r.person.name}</b>
                <div style={{ marginTop: 2 }}><RaceTeam row={r} /></div>
              </div>
            </div>
            <div style={{ textAlign: "right", flex: "0 0 auto" }}>
              <ProgressPill prog={r.prog} eliminated={r.eliminated} />
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <p className="muted" style={{ padding: "0 16px 14px", margin: 0, fontSize: 11.5 }}>
          {meta.emoji} {cur}{amount} to whoever's {meta.sub.replace(" teams", "")} team goes furthest. Level teams are split on
          <b> group points → goal difference → goals scored</b>.
        </p>
      )}
    </div>
  );
}

/* ---- compact two-pot summary for the Home screen ---- */
function RaceMiniDual({ goTo }) {
  if (!Store.state.draw.done) return null;
  const cur = Store.state.config.currency;
  const amount = Store.potTotal();
  const line = (pot) => {
    const meta = POT_META[pot];
    const rows = Store.raceByPot(pot);
    const w = Store.potWinnerLocked(pot);
    const lead = w || rows[0];
    return (
      <div className="between" style={{ padding: "10px 6px", gap: 8 }}>
        <div className="row" style={{ gap: 10, minWidth: 0 }}>
          <div style={{ fontSize: 22 }}>{meta.emoji}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 15, textTransform: "uppercase" }}>{meta.name} · {cur}{amount}</div>
            {lead && lead.team
              ? <div style={{ fontSize: 12.5, fontWeight: 700 }}>{w ? "🏆 " : ""}{lead.person.emoji} {lead.person.name} — {lead.team.name}</div>
              : <div className="muted" style={{ fontSize: 12 }}>not started</div>}
          </div>
        </div>
        {lead && lead.team && <ProgressPill prog={lead.prog} eliminated={lead.eliminated} />}
      </div>
    );
  };
  return (
    <div className="card">
      <span className="zig" />
      <div className="between" style={{ padding: "12px 16px 0" }}>
        <div className="section-title"><span className="dot" />The Races — who's furthest</div>
        <button className="btn sm" onClick={() => goTo && goTo("standings")}>Both races →</button>
      </div>
      <div style={{ padding: "4px 12px 8px" }}>
        {line("pick")}
        <div style={{ borderTop: "2px dashed #e7ddc6" }} />
        {line("dip")}
      </div>
      <p className="muted" style={{ padding: "0 16px 14px", margin: 0, fontSize: 11.5 }}>
        Two separate pots — your chosen team and your random team each race for {cur}{amount}.
      </p>
    </div>
  );
}

Object.assign(window, { RaceBoard, RaceMiniDual, ProgressPill, levelStyle });
