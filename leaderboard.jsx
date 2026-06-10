/* ============================================================
   leaderboard.jsx — "The Race": who's winning the sweepstake.
   Each person owns 2 teams; rank by their BEST team's progress.
   Winner = whoever's team goes furthest.
   ============================================================ */

/* colour + emoji for a progress level (0 group-out … 6 champions) */
function levelStyle(level) {
  if (level >= 6) return { bg: "var(--gold)", fg: "var(--ink)", ic: "🏆" };
  if (level >= 4) return { bg: "var(--green)", fg: "#fff", ic: "🔥" };
  if (level >= 1) return { bg: "var(--blue)", fg: "#fff", ic: "✅" };
  return { bg: "#e7ddc6", fg: "var(--ink)", ic: "•" };
}

function ProgressPill({ prog }) {
  const s = levelStyle(prog.level);
  return (
    <span className="pill" style={{ background: s.bg, color: s.fg, fontSize: 10 }}>
      {s.ic} {prog.label}
    </span>
  );
}

/* one team line for the race rows */
function RaceTeam({ entry, dim }) {
  if (!entry) return <span className="muted">—</span>;
  return (
    <span className="teamline" style={{ opacity: dim ? 0.5 : 1, gap: 7 }}>
      <Flag code={entry.team.code} size={16} />
      <span className="nm" style={{ fontWeight: 800, fontSize: 13.5 }}>{entry.team.name}</span>
    </span>
  );
}

function RaceBoard({ goTo, compact }) {
  if (!Store.state.draw.done) return null;
  const rows = Store.personRace();
  const decided = Store.raceDecided();
  const shown = compact ? rows.slice(0, 3) : rows;
  const leader = rows[0];

  return (
    <div className="card">
      <span className="zig" />
      <div className="between" style={{ padding: "12px 16px 0" }}>
        <div className="section-title"><span className="dot" />{decided ? "🏆 The winner" : "The Race — who's furthest"}</div>
        {compact && <button className="btn sm" onClick={() => goTo && goTo("standings")}>Full race →</button>}
      </div>

      {/* winner / current-leader banner */}
      {leader && (
        <div className="card-pad" style={{ paddingBottom: 6 }}>
          <div className="row" style={{ gap: 12, background: "var(--gold)", border: "3px solid var(--ink)", borderRadius: 14, padding: "10px 14px", boxShadow: "var(--shadow-sm)" }}>
            <div className="ava" style={{ width: 46, height: 46, fontSize: 24 }}>{leader.person.emoji}</div>
            <div style={{ minWidth: 0 }}>
              <div className="kicker" style={{ color: "var(--ink)", opacity: .65 }}>{decided ? "Takes the pot" : "Leading right now"}</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 24, textTransform: "uppercase", lineHeight: 1 }}>{leader.person.name}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 2 }}>
                {leader.best ? `${leader.best.team.name} · ${leader.best.prog.label}` : "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "4px 12px 14px" }}>
        {shown.map((r, i) => {
          const isLeader = i === 0;
          const other = r.teams[1];
          return (
            <div key={r.person.id} className="between"
              style={{ padding: "9px 6px", borderBottom: i < shown.length - 1 ? "2px dashed #e7ddc6" : "none", background: isLeader ? "rgba(255,184,28,.12)" : "transparent", borderRadius: 8 }}>
              <div className="row" style={{ gap: 10, minWidth: 0 }}>
                <div className="hero-num" style={{ fontSize: 26, width: 26, textAlign: "center", color: isLeader ? "var(--red)" : "#bcae90" }}>{i + 1}</div>
                <Ava id={r.person.id} sm />
                <div style={{ minWidth: 0 }}>
                  <b style={{ fontSize: 16 }}>{r.person.name}</b>
                  <div style={{ marginTop: 2 }}><RaceTeam entry={r.best} /></div>
                  {!compact && other && other !== r.best && (
                    <div style={{ marginTop: 2 }}><RaceTeam entry={other} dim /></div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                {r.best && <ProgressPill prog={r.best.prog} />}
              </div>
            </div>
          );
        })}
      </div>

      <p className="muted" style={{ padding: "0 16px 14px", margin: 0, fontSize: 11.5 }}>
        Ranked by each person's <b>furthest team</b>. {decided ? "" : "Level pegging is broken by group points, then goal difference. "}
        Updates as scores come in.
      </p>
    </div>
  );
}

Object.assign(window, { RaceBoard, ProgressPill, levelStyle });
