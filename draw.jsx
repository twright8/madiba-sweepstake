/* ============================================================
   draw.jsx — the live animated sweepstake draw
   Phases: intro → order → draft (Pot 1) → deal (Pot 2) → done
   ============================================================ */
function Draw({ goTo }) {
  const d = Store.state.draw;
  const order = d.order || [];
  const picksMade = Object.values(d.pot1 || {}).reduce((n, l) => n + l.length, 0);

  // derive base phase from persisted state
  function basePhase() {
    if (d.done) return "done";
    if (!order.length) return "intro";
    if (picksMade < order.length) return "draft";
    return "pot2";
  }
  const [phase, setPhase] = useState(basePhase());
  const [revealed, setRevealed] = useState(order.length ? order.length : 0);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => { setPhase(basePhase()); /* eslint-disable-next-line */ }, [d.done, order.length, picksMade]);

  /* ----- ORDER ROLL ----- */
  function rollOrder() {
    Store.rollOrder();
    setPhase("order");
    setRevealed(0);
  }
  useEffect(() => {
    if (phase !== "order") return;
    if (revealed >= order.length) {
      const t = setTimeout(() => setPhase("draft"), 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRevealed(r => r + 1), 520);
    return () => clearTimeout(t);
  }, [phase, revealed, order.length]);

  /* ----- POT 2 (click-to-reveal) ----- */
  function fireConfetti() {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3200);
  }

  function reset() {
    if (confirm("Scrap the entire draw and start again? Everyone's teams will be wiped.")) {
      Store.resetDraw();
      setPhase("intro");
      setRevealed(0);
    }
  }

  return (
    <div className="wrap" style={{ paddingTop: 18 }}>
      <Confetti go={confetti} />
      {phase === "intro" && (window.HOST ? <DrawIntro onRoll={rollOrder} /> : <DrawWaiting />)}
      {phase === "order" && <OrderReveal order={order} revealed={revealed} />}
      {phase === "draft" && <Draft picksMade={picksMade} order={order} />}
      {phase === "pot2" && <Pot2Stage order={order} onDone={fireConfetti} />}
      {phase === "done" && <DrawDone goTo={goTo} onReset={reset} />}
    </div>
  );
}

/* ---------- intro ---------- */
function DrawIntro({ onRoll }) {
  return (
    <div className="grid" style={{ gap: 16, maxWidth: 620, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <div className="kicker">The Big Draw</div>
        <h1 style={{ fontSize: "clamp(34px,9vw,60px)", margin: "6px 0" }}>Two pots,<br />one braai.</h1>
      </div>
      <Card title="How it works">
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontWeight: 600 }}>
          <li><b>Pot 1 — the draft.</b> Everyone gets a random pick order. In turn, you choose <i>any</i> team you fancy. One each.</li>
          <li><b>Pot 2 — the lucky dip.</b> Then, once Pot 1 is done, you each tap to reveal <b>one</b> random team — luck of the draw, no skill, no blame.</li>
          <li>Everyone ends up with <b>2 teams</b>. Winner is whoever's team goes <b>furthest</b> in the tournament → you take the pot. Simple.</li>
        </ol>
        <p className="muted" style={{ marginBottom: 0, marginTop: 14, fontSize: 14 }}>
          Not fussed about choosing? There's a <b>“🎲 Pick for me”</b> button. Yes Shafeea, that one's for you.
        </p>
      </Card>
      <button className="btn green big" onClick={onRoll}>🎲 &nbsp;Roll the pick order</button>
      <p className="muted" style={{ textAlign: "center", fontSize: 13, margin: 0 }}>
        Everyone picks from their own phone — when it's your turn, Tom sends you the link.
      </p>
    </div>
  );
}

/* ---------- waiting (non-host, before the draw starts) ---------- */
function DrawWaiting() {
  return (
    <div className="grid" style={{ gap: 16, maxWidth: 560, margin: "0 auto", paddingTop: 8 }}>
      <div style={{ textAlign: "center" }}>
        <div className="kicker">The Big Draw</div>
        <h1 style={{ fontSize: "clamp(30px,8vw,52px)", margin: "6px 0" }}>Hang tight…</h1>
      </div>
      <Card title="How it works">
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontWeight: 600 }}>
          <li><b>Tom kicks off the draw</b> and a random pick order is drawn.</li>
          <li><b>When it's your turn, you'll get a link.</b> Open it, <b>choose your team</b> (Pot 1), then tap once for a <b>random team</b> (Pot 2).</li>
          <li>Everyone ends up with <b>2 teams</b>. Winner is whoever's team goes <b>furthest</b>.</li>
        </ol>
        <p className="muted" style={{ marginBottom: 0, marginTop: 14, fontSize: 14 }}>
          Keep an eye on the family chat — Tom will tell you when you're up. 🇿🇦
        </p>
      </Card>
    </div>
  );
}

/* ---------- order reveal ---------- */
function OrderReveal({ order, revealed }) {
  return (
    <div className="grid" style={{ gap: 14, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center" }}>
        <div className="kicker">Pick order</div>
        <h1 style={{ fontSize: "clamp(28px,7vw,44px)", margin: "4px 0 2px" }}>Who chooses first?</h1>
        <p className="muted" style={{ margin: 0 }}>The hat has spoken.</p>
      </div>
      <div className="grid" style={{ gap: 10 }}>
        {order.map((id, i) => {
          const shown = i < revealed;
          const p = WC.PEOPLE.find(p => p.id === id);
          return (
            <div key={id} className={"card flat " + (shown ? "pop" : "")}
              style={{ display: shown ? "flex" : "none", alignItems: "center", gap: 14, padding: "10px 14px" }}>
              <div className="hero-num" style={{ fontSize: 40, width: 52, textAlign: "center", color: i === 0 ? "var(--red)" : "var(--ink)" }}>{i + 1}</div>
              <Ava id={id} />
              <b style={{ fontSize: 22, fontFamily: "var(--display)", textTransform: "uppercase" }}>{p.name}</b>
              {i === 0 && <span className="pill red" style={{ marginLeft: "auto" }}>First dibs</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- draft (Pot 1) ---------- */
function Draft({ picksMade, order }) {
  const currentId = order[picksMade];
  const person = WC.PEOPLE.find(p => p.id === currentId);
  const [pending, setPending] = useState(null); // team code chosen, awaiting confirm
  const [filter, setFilter] = useState("ALL");
  const avail = Store.availablePot1();

  // last pick just happened — parent is about to switch to the deal phase
  if (!currentId || !person) {
    return <div className="card card-pad" style={{ textAlign: "center", padding: 40 }}>
      <b style={{ fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase" }}>Pot 1 locked in…</b>
    </div>;
  }

  function lock(code) {
    Store.pot1Pick(currentId, code);
    setPending(null);
  }
  function pickForMe() {
    const t = Store.pot1RandomFor(currentId);
    setPending(null);
    // brief celebratory flash handled by re-render
  }

  const groups = ["ALL", "★", ...WC.GROUPS];
  const list = avail.filter(t =>
    filter === "ALL" ? true : filter === "★" ? t.fav : t.group === filter
  );

  return (
    <div className="grid" style={{ gap: 14 }}>
      {/* turn banner */}
      <div className="card" style={{ background: "var(--gold)", borderWidth: 3 }}>
        <span className="flagband"><i /><i /><i /><i /><i /><i /></span>
        <div className="between" style={{ padding: "12px 16px" }}>
          <div className="row" style={{ gap: 12 }}>
            <Ava id={currentId} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", opacity: .7 }}>
                Pick {picksMade + 1} of {order.length}
              </div>
              <div style={{ fontFamily: "var(--display)", fontSize: 26, textTransform: "uppercase", lineHeight: 1, whiteSpace: "nowrap" }}>
                {person.name}'s pick
              </div>
              {currentId === "shafeea" && <div style={{ fontSize: 11.5, fontWeight: 700, opacity: .75 }}>About to pick a team she won't recognise. Respect.</div>}
            </div>
          </div>
          <button className="btn blue sm" style={{ whiteSpace: "nowrap" }} onClick={pickForMe}>🎲 Pick for me</button>
        </div>
        {/* mini order tracker */}
        <div className="row" style={{ gap: 6, padding: "0 16px 12px", flexWrap: "wrap" }}>
          {order.map((id, i) => (
            <div key={id} title={WC.PEOPLE.find(p => p.id === id).name}
              style={{
                opacity: i < picksMade ? .35 : i === picksMade ? 1 : .65,
                outline: i === picksMade ? "3px solid var(--ink)" : "none",
                borderRadius: 11,
              }}>
              <Ava id={id} sm />
            </div>
          ))}
        </div>
      </div>

      {/* filter chips */}
      <div className="row" style={{ gap: 7, flexWrap: "wrap" }}>
        {groups.map(g => (
          <button key={g} className={"pill " + (filter === g ? "green" : "")}
            style={{ cursor: "pointer", fontFamily: "var(--body)" }}
            onClick={() => setFilter(g)}>
            {g === "ALL" ? "All teams" : g === "★" ? "★ Contenders" : "Group " + g}
          </button>
        ))}
      </div>

      {/* team grid */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
        {list.map(t => (
          <button key={t.code} className="card flat" onClick={() => setPending(t.code)}
            style={{
              padding: "12px 10px", textAlign: "left", background: pending === t.code ? "var(--green)" : "var(--white)",
              color: pending === t.code ? "#fff" : "var(--ink)", cursor: "pointer", border: "3px solid var(--ink)",
            }}>
            <div style={{ lineHeight: 1 }}><Flag code={t.code} size={30} /></div>
            <div style={{ fontWeight: 900, marginTop: 6, fontSize: 15 }}>
              {t.name} {t.fav && <span style={{ color: pending === t.code ? "#fff" : "var(--gold)", WebkitTextStroke: "1px #161310" }}>★</span>}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: .6, textTransform: "uppercase", letterSpacing: ".08em" }}>Group {t.group}</div>
          </button>
        ))}
      </div>

      {/* confirm bar */}
      {pending && (
        <div className="card slidein" style={{
          position: "sticky", bottom: 104, zIndex: 30, background: "var(--ink)", color: "#fff", borderColor: "var(--gold)",
        }}>
          <div className="between" style={{ padding: 14, flexWrap: "wrap", gap: 10 }}>
            <div className="row" style={{ gap: 10 }}>
              <Flag code={pending} size={28} />
              <div style={{ fontWeight: 800 }}>
                Lock in <b style={{ color: "var(--gold)" }}>{WC.TEAM_BY_CODE[pending].name}</b><br />
                <span style={{ fontSize: 13, opacity: .75 }}>for {person.name}?</span>
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn sm" onClick={() => setPending(null)}>Back</button>
              <button className="btn gold sm" onClick={() => lock(pending)}>Lock it in ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Pot 2: one random team per person, auto-advancing across devices ---------- */
function Pot2Stage({ order, onDone }) {
  const target = Store.pot2Target();
  const draw = Store.state.draw;
  // whose turn it is = first person still without their random team (shared, derived)
  const firstIncomplete = order.find(id => (draw.pot2[id] || []).length < target);
  const allDone = !firstIncomplete;
  const holdId = firstIncomplete || order[order.length - 1];

  const [spinning, setSpinning] = useState(false);
  const [reel, setReel] = useState(null);            // spinning / just-revealed code (this device only)
  const [revealedFor, setRevealedFor] = useState(null);

  // while a reveal result is on screen, keep showing the person it was for; otherwise the current turn
  const resultMode = !!reel && !spinning && !!revealedFor;
  const displayId = resultMode ? revealedFor : holdId;
  const person = WC.PEOPLE.find(p => p.id === displayId);
  const list = draw.pot2[displayId] || [];

  function reveal() {
    if (spinning || allDone || (draw.pot2[holdId] || []).length >= target) return;
    const who = holdId;
    setSpinning(true); setRevealedFor(who);
    let ticks = 0;
    const avail = Store.availablePot2();
    const iv = setInterval(() => {
      setReel(avail[Math.floor(Math.random() * avail.length)].code);
      if (++ticks > 9) {
        clearInterval(iv);
        const got = Store.pot2RandomFor(who);
        setReel(got ? got.code : null);
        setSpinning(false);
        if (Store.state.draw.done) onDone && onDone();
      }
    }, 70);
  }
  function next() { setReel(null); setRevealedFor(null); }

  const nextName = firstIncomplete ? (WC.PEOPLE.find(p => p.id === firstIncomplete) || {}).name : null;

  return (
    <div className="grid" style={{ gap: 14, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginTop: 2 }}>
        <div className="kicker">Pot 2 · The lucky dip</div>
        <h1 style={{ fontSize: "clamp(26px,7vw,42px)", margin: "4px 0 2px" }}>One random team each</h1>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>Pure chance. When it's your turn, tap to reveal.</p>
      </div>

      {/* current player card */}
      <div className="card" style={{ background: "var(--blue)", color: "#fff", borderColor: "var(--ink)" }}>
        <span className="flagband"><i /><i /><i /><i /><i /><i /></span>
        <div className="card-pad">
          <div className="between">
            <div className="row" style={{ gap: 10 }}>
              <Ava id={displayId} />
              <div style={{ fontFamily: "var(--display)", fontSize: 24, textTransform: "uppercase", lineHeight: 1 }}>{person.name}</div>
            </div>
            <span className="pill gold" style={{ color: "var(--ink)" }}>{resultMode ? "Done" : "Your turn"}</span>
          </div>

          {/* reel / result */}
          <div style={{ marginTop: 14, minHeight: 92, display: "grid", placeItems: "center" }}>
            {spinning ? (
              <div className="card" style={{ padding: "14px 18px", background: "#fff", color: "var(--ink)", transform: "scale(1.05)" }}>
                <div className="row" style={{ gap: 10 }}>
                  {reel && <Flag code={reel} size={30} />}
                  <b style={{ fontFamily: "var(--display)", fontSize: 22 }}>{reel ? WC.TEAM_BY_CODE[reel].name : "…"}</b>
                </div>
              </div>
            ) : resultMode ? (
              <div className="card pop" style={{ padding: "14px 18px", background: "var(--gold)", color: "var(--ink)", borderColor: "var(--ink)" }}>
                <div className="kicker" style={{ textAlign: "center" }}>{person.name} got</div>
                <div className="row" style={{ gap: 12, marginTop: 4 }}>
                  <Flag code={reel} size={36} />
                  <b style={{ fontFamily: "var(--display)", fontSize: 26 }}>{reel ? WC.TEAM_BY_CODE[reel].name : "—"}</b>
                </div>
              </div>
            ) : (
              <div className="muted" style={{ color: "rgba(255,255,255,.85)", fontWeight: 700, textAlign: "center" }}>
                {allDone ? "Everyone's in!" : `${person.name}, tap the button to reveal your team.`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* actions */}
      {spinning ? (
        <button className="btn red big" disabled>Spinning…</button>
      ) : resultMode ? (
        firstIncomplete
          ? <button className="btn green big" onClick={next}>Next: {nextName} →</button>
          : <button className="btn green big" onClick={() => onDone && onDone()}>🎉  Everyone's in — see the squads</button>
      ) : allDone ? (
        <button className="btn green big" onClick={() => onDone && onDone()}>🎉  Everyone's in — see the squads</button>
      ) : (
        <button className="btn red big" onClick={reveal}>🎲  Reveal {person.name}'s team</button>
      )}

      {/* mini progress of everyone */}
      <div className="card flat" style={{ padding: "10px 12px" }}>
        <div className="row" style={{ gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {order.map(id => {
            const n = (draw.pot2[id] || []).length;
            return (
              <div key={id} className="row" style={{ gap: 5, opacity: n >= target ? 1 : .5 }}>
                <Ava id={id} sm />
                <span style={{ fontWeight: 800, fontSize: 12 }}>{n >= target ? "✓" : "…"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- done ---------- */
function DrawDone({ goTo, onReset }) {
  const d = Store.state.draw;
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <div className="kicker">That's a wrap</div>
        <h1 style={{ fontSize: "clamp(30px,8vw,54px)", margin: "6px 0" }}>The draw is done!</h1>
        <p className="muted" style={{ margin: 0 }}>Two teams each. May the best Saffa win.</p>
      </div>

      {window.HOST && !d.locked && (
        <div className="card card-pad" style={{ background: "var(--gold)", textAlign: "center" }}>
          <b style={{ fontFamily: "var(--display)", fontSize: 18, textTransform: "uppercase" }}>One last step</b>
          <p style={{ fontWeight: 600, margin: "6px 0 10px", fontSize: 14 }}>Lock the draw in for the whole family. After this, nobody can re-roll it.</p>
          <button className="btn red" onClick={() => Store.lockDraw()}>🔒 &nbsp;Lock the draw</button>
        </div>
      )}
      {d.locked && (
        <div className="card card-pad" style={{ background: "var(--green)", color: "#fff", textAlign: "center" }}>
          <b style={{ fontFamily: "var(--display)", fontSize: 16, textTransform: "uppercase" }}>🔒 Draw locked — it's official</b>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {d.order.map(id => (
          <SquadCard key={id} id={id} />
        ))}
      </div>

      <div className="row" style={{ gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
        <button className="btn green" onClick={() => goTo("squads")}>See full squads →</button>
        {window.HOST && !d.locked && <button className="btn ghost sm" onClick={onReset}>Re-draw everything</button>}
        {window.HOST && (
          <button className="btn ghost sm" onClick={() => {
            if (confirm("Wipe EVERYTHING — the draw, all scores and paid status — and start from a clean slate? This clears it for everyone.")) Store.resetAll();
          }}>🧹 Reset everything</button>
        )}
      </div>
    </div>
  );
}

/* compact squad card reused */
function SquadCard({ id }) {
  const p = WC.PEOPLE.find(p => p.id === id);
  const teams = Store.teamsOf(id);
  const p1 = (Store.state.draw.pot1[id] || []);
  return (
    <div className="card flat slidein">
      <div className="row" style={{ gap: 10, padding: "12px 14px 8px" }}>
        <Ava id={id} />
        <b style={{ fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase" }}>{p.name}</b>
      </div>
      <div className="zig" style={{ height: 10, borderWidth: 2 }} />
      <div style={{ padding: "10px 14px 14px" }}>
        {teams.map(t => (
          <div key={t.code} className="between" style={{ padding: "4px 0" }}>
            <TeamLine code={t.code} size="20px" />
            {p1.includes(t.code) ? <span className="pill gold" style={{ fontSize: 10 }}>Pick</span> : <span className="pill grey" style={{ fontSize: 10 }}>Dip</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Draw, SquadCard });
