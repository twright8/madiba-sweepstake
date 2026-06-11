/* ============================================================
   screens.jsx — Home, Squads, Pot (money + paid tracker)
   ============================================================ */

/* ---- shared: find fixtures with resolved team codes ---- */
function teamCodeOf(slotOrCode) {
  if (WC.TEAM_BY_CODE[slotOrCode]) return slotOrCode;
  return Store.resolveSlot(slotOrCode);
}
function nextFixture(ownedOnly) {
  const now = Date.now();
  const owners = Store.state.draw.owners || {};
  const list = WC.FIXTURES
    .map(f => ({ f, h: teamCodeOf(f.home), a: teamCodeOf(f.away) }))
    .filter(x => new Date(x.f.kickoff).getTime() > now - 2 * 3600e3) // include in-progress (last 2h)
    .filter(x => !Store.getScore(x.f.id));
  const pick = ownedOnly
    ? list.find(x => (x.h && owners[x.h]) || (x.a && owners[x.a]))
    : list[0];
  return pick || list[0] || null;
}

/* ============================ HOME ============================ */
function Home({ goTo }) {
  const drawDone = Store.state.draw.done;
  const drawStarted = (Store.state.draw.order || []).length > 0;
  const [egg, setEgg] = useState(false);
  const pot = Store.potTotal();
  const collected = Store.collected();
  const cur = Store.state.config.currency;
  const next = nextFixture(drawDone);

  // champion (if final scored)
  const finalFx = WC.FIXTURES.find(f => f.stage === "FINAL");
  const champ = useMemo(() => {
    const s = Store.getScore(finalFx.id);
    if (!s) return null;
    const h = teamCodeOf(finalFx.home), a = teamCodeOf(finalFx.away);
    if (!h || !a || s.h === s.a) return null;
    return s.h > s.a ? h : a;
  }, [Store.state.scores, Store.state.koTeams]);

  return (
    <div className="wrap grid" style={{ gap: 16, paddingTop: 16 }}>
      {/* hero */}
      <div className="card" style={{ background: "var(--green)", color: "#fff", borderColor: "var(--ink)" }}>
        <span className="zig" />
        <div style={{ padding: "20px 18px" }}>
          <div className="kicker" style={{ color: "var(--gold)" }}>FIFA World Cup 2026 · Family Sweepstake</div>
          <h1 style={{ fontSize: "clamp(32px,9vw,58px)", margin: "8px 0 6px", color: "#fff" }}>
            Madiba Magic<br />Sweepstake
          </h1>
          <p style={{ margin: 0, fontWeight: 600, maxWidth: 520, opacity: .95 }}>
            Ten Saffas. Forty-eight teams. One pot. Two teams each, winner goes furthest. Kick-off <b>11 June, 21:00 SAST</b> — Mexico vs Bafana Bafana.
          </p>
        </div>
      </div>

      {drawDone && <RaceBoard goTo={goTo} compact />}
      {champ && <ChampBanner champ={champ} />}

      {/* draw CTA or status */}
      {drawStarted && !drawDone ? (
        <div className="card card-pad" style={{ textAlign: "center", background: "var(--red)", color: "#fff" }}>
          <h2 style={{ fontSize: 26, color: "#fff" }}>🔴 &nbsp;The draw is LIVE</h2>
          <p style={{ fontWeight: 600, marginTop: 6 }}>Picks are happening now. When it's your turn, jump in and grab your team.</p>
          <button className="btn gold big" style={{ maxWidth: 340, margin: "8px auto 0" }} onClick={() => goTo("draw")}>
            🎲 &nbsp;Go to the draw
          </button>
        </div>
      ) : !drawDone ? (
        <div className="card card-pad" style={{ textAlign: "center", background: "var(--gold)" }}>
          <h2 style={{ fontSize: 26 }}>The draw hasn't happened yet</h2>
          {window.HOST ? (
            <>
              <p style={{ fontWeight: 600, marginTop: 6 }}>Kick it off, then text each person to grab their team on their phone.</p>
              <button className="btn red big" style={{ maxWidth: 340, margin: "8px auto 0" }} onClick={() => goTo("draw")}>
                🎲 &nbsp;Run the draw
              </button>
            </>
          ) : (
            <p style={{ fontWeight: 600, marginTop: 6 }}>When it's your turn, Tom will send you the link to pick your own team. Your two teams show up here once the draw's done. 🇿🇦</p>
          )}
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <button className="card flat" onClick={() => goTo("squads")} style={{ textAlign: "left", cursor: "pointer", border: "3px solid var(--ink)", background: "var(--white)" }}>
            <div className="card-pad">
              <div className="section-title"><span className="dot" />Squads</div>
              <p className="muted" style={{ margin: "8px 0 0", fontSize: 14 }}>See who drew whom. Two teams each.</p>
            </div>
          </button>
          <button className="card flat" onClick={() => goTo("standings")} style={{ textAlign: "left", cursor: "pointer", border: "3px solid var(--ink)", background: "var(--white)" }}>
            <div className="card-pad">
              <div className="section-title"><span className="dot" />Standings</div>
              <p className="muted" style={{ margin: "8px 0 0", fontSize: 14 }}>Group tables & who's still alive.</p>
            </div>
          </button>
        </div>
      )}

      {/* next match */}
      {next && <NextMatchCard x={next} goTo={goTo} />}

      {/* pot */}
      <div className="card">
        <span className="flagband"><i /><i /><i /><i /><i /><i /></span>
        <div className="card-pad">
          <div className="between">
            <div className="section-title"><span className="dot" />The Pot</div>
            <button className="btn sm" onClick={() => goTo("pot")}>Manage →</button>
          </div>
          <div className="between" style={{ marginTop: 12, alignItems: "flex-end" }}>
            <div>
              <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 800 }}>Total prize pot</div>
              <div className="hero-num" style={{ fontSize: 54 }}>{cur}{pot}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="pill" style={{ background: collected === pot ? "var(--green)" : "var(--gold)", color: collected === pot ? "#fff" : "var(--ink)" }}>
                {cur}{collected} collected
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                {collected === pot ? "Everyone's paid up. A miracle." : `${cur}${pot - collected} still floating around`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="muted" style={{ textAlign: "center", fontSize: 12.5, margin: "2px 0 0" }}>
        Winner = whoever's team goes <b>furthest</b> in the tournament. Last Saffa standing takes the pot.
      </p>
      <p className="muted" style={{ textAlign: "center", fontSize: 12.5, margin: "-8px 0 0", fontStyle: "italic", opacity: .8 }}>
        Shafeea has requested two random teams and a diagram of the offside rule. Only one will be provided.
      </p>

      {/* hidden right at the bottom — for whoever scrolls this far */}
      <div style={{ textAlign: "center", padding: "26px 0 6px", opacity: .5 }}>
        <img
          src={(window.__resources && window.__resources.eidEgg) || "assets/eid-mu.jpg"}
          alt="Eid Mu…barack"
          title="Eid Mu…"
          onClick={() => setEgg(true)}
          style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", filter: "grayscale(1)", border: "2px solid #d8cba8", cursor: "pointer" }}
        />
        <div className="muted" style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", marginTop: 6, opacity: .7 }}>Eid Mu…</div>
      </div>
      {egg && <EasterEgg onClose={() => setEgg(false)} />}
    </div>
  );
}

function ChampBanner({ champ }) {
  const owner = Store.ownerOf(champ);
  const p = owner && WC.PEOPLE.find(x => x.id === owner);
  return (
    <div className="card" style={{ background: "var(--gold)", borderColor: "var(--ink)" }}>
      <span className="zig" />
      <div className="card-pad" style={{ textAlign: "center" }}>
        <div className="kicker">🏆 World Champions 🏆</div>
        <div style={{ margin: "6px 0" }}><Flag code={champ} size={40} /></div>
        <h2 style={{ fontSize: 30 }}>{WC.TEAM_BY_CODE[champ].name}</h2>
        {p ? <p style={{ fontWeight: 800, margin: "8px 0 0", fontSize: 18 }}>Owned by {p.emoji} {p.name}. The pot still goes to whoever went furthest — see the race.</p>
          : <p className="muted" style={{ margin: "8px 0 0" }}>Nobody owned the champions — but somebody still went furthest. See the race for the pot winner.</p>}
      </div>
    </div>
  );
}

function NextMatchCard({ x, goTo }) {
  const { f, h, a } = x;
  const owners = Store.state.draw.owners || {};
  const stage = WC.STAGE_LABEL[f.stage] + (f.group ? " · Group " + f.group : "");
  return (
    <div className="card" onClick={() => goTo("fixtures")} style={{ cursor: "pointer" }}>
      <div className="between" style={{ padding: "12px 16px 0" }}>
        <div className="section-title"><span className="dot" />Next up</div>
        <span className="tag-stage">{stage}</span>
      </div>
      <div className="card-pad">
        <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
          <MatchSide code={h} owner={owners[h]} />
          <div style={{ textAlign: "center", flex: "0 0 auto" }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 22 }}>{fmtTime(f.kickoff)}</div>
            <div className="muted" style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{fmtDay(f.kickoff)}</div>
            <div className="pill grey" style={{ fontSize: 9, marginTop: 4 }}>SAST</div>
          </div>
          <MatchSide code={a} owner={owners[a]} right />
        </div>
        <div className="muted" style={{ textAlign: "center", fontSize: 12, marginTop: 10 }}>{f.venue} · {f.city}</div>
      </div>
    </div>
  );
}
function MatchSide({ code, owner, right }) {
  const t = code && WC.TEAM_BY_CODE[code];
  const p = owner && WC.PEOPLE.find(x => x.id === owner);
  return (
    <div style={{ flex: 1, textAlign: right ? "right" : "left", minWidth: 0 }}>
      <div style={{ fontSize: 34 }}>{t ? <Flag code={code} size={32} /> : "❓"}</div>
      <div style={{ fontWeight: 900, fontSize: 16 }}>{t ? t.name : "TBC"}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: p ? "var(--blue)" : "var(--muted)" }}>
        {p ? `${p.emoji} ${p.name}` : <span className="muted">unclaimed</span>}
      </div>
    </div>
  );
}

/* ============================ SQUADS ============================ */
function Squads() {
  const drawDone = Store.state.draw.done;
  const [focus, setFocus] = useState(null);
  if (!drawDone) return <EmptyState title="No squads yet" msg="Once the draw is done, everyone's two teams show up here — ready to screenshot." />;

  const order = Store.state.draw.order;
  return (
    <div className="wrap grid" style={{ gap: 16, paddingTop: 16 }}>
      <div className="between">
        <div>
          <h1 style={{ fontSize: 30 }}>The Squads</h1>
          <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>Two teams each — one pick, one lucky dip. No refunds, no swaps, no sympathy.</p>
        </div>
        <span className="pill grey">Tap to enlarge</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {order.map(id => (
          <div key={id} onClick={() => setFocus(id)} style={{ cursor: "pointer" }}>
            <DetailedSquad id={id} />
          </div>
        ))}
      </div>
      {focus && <ScreenshotCard id={focus} onClose={() => setFocus(null)} />}
    </div>
  );
}

function DetailedSquad({ id }) {
  const p = WC.PEOPLE.find(p => p.id === id);
  const teams = Store.teamsOf(id);
  const p1 = Store.state.draw.pot1[id] || [];
  const alive = teams.filter(t => Store.teamStatus(t.code).state !== "out").length;
  return (
    <div className="card flat">
      <div className="between" style={{ padding: "12px 14px 8px" }}>
        <div className="row" style={{ gap: 10 }}>
          <Ava id={id} />
          <b style={{ fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase" }}>{p.name}</b>
        </div>
        <span className="pill grey" style={{ fontSize: 10 }}>{alive} alive</span>
      </div>
      <div className="zig" style={{ height: 10, borderWidth: 2 }} />
      <div style={{ padding: "9px 14px 2px" }}>
        <div className="muted" style={{ fontSize: 11.5, fontStyle: "italic", lineHeight: 1.3 }}>{squadVerdict(teams.map(t => t.code))}</div>
      </div>
      <div style={{ padding: "6px 14px 14px" }}>
        {teams.map(t => {
          const st = Store.teamStatus(t.code);
          return (
            <div key={t.code} className="between" style={{ padding: "5px 0", opacity: st.state === "out" ? .4 : 1 }}>
              <span className="teamline">
                <span style={{ textDecoration: st.state === "out" ? "line-through" : "none", display: "inline-flex" }}><Flag code={t.code} size={20} /></span>
                <span className="nm" style={{ textDecoration: st.state === "out" ? "line-through" : "none" }}>{t.name}</span>
                {t.fav && <span className="fav-star">★</span>}
              </span>
              <span className="pill" style={{
                fontSize: 9,
                background: st.state === "alive" ? "var(--green)" : st.state === "out" ? "#e7ddc6" : "var(--white)",
                color: st.state === "alive" ? "#fff" : "var(--ink)",
              }}>{p1.includes(t.code) ? "Pick" : "Dip"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* big shareable card */
function ScreenshotCard({ id, onClose }) {
  const p = WC.PEOPLE.find(p => p.id === id);
  const teams = Store.teamsOf(id);
  const p1 = Store.state.draw.pot1[id] || [];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,15,10,.7)", zIndex: 70, display: "grid", placeItems: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} className="card pop" style={{ maxWidth: 420, width: "100%", background: "var(--green)", color: "#fff", borderColor: "var(--gold)" }}>
        <span className="zig" />
        <div style={{ padding: "20px 22px" }}>
          <div className="kicker" style={{ color: "var(--gold)" }}>My World Cup squad</div>
          <div className="row" style={{ gap: 12, margin: "8px 0 4px" }}>
            <div className="ava" style={{ width: 52, height: 52, fontSize: 26, background: "var(--gold)" }}>{p.emoji}</div>
            <h1 style={{ fontSize: 38, color: "#fff" }}>{p.name}</h1>
          </div>
          <div style={{ fontSize: 12.5, fontStyle: "italic", color: "var(--gold)", fontWeight: 700, marginBottom: 4 }}>{squadVerdict(teams.map(t => t.code))}</div>
          <div className="grid" style={{ gap: 6, marginTop: 12 }}>
            {teams.map(t => (
              <div key={t.code} className="between" style={{ background: "rgba(255,255,255,.12)", border: "2px solid rgba(0,0,0,.25)", borderRadius: 12, padding: "8px 12px" }}>
                <span className="teamline"><Flag code={t.code} size={22} /><b style={{ fontSize: 17 }}>{t.name}</b></span>
                <span className="pill" style={{ fontSize: 9, background: p1.includes(t.code) ? "var(--gold)" : "rgba(255,255,255,.25)", color: p1.includes(t.code) ? "var(--ink)" : "#fff", border: "2px solid rgba(0,0,0,.3)" }}>
                  {p1.includes(t.code) ? "MY PICK" : "LUCKY DIP"}
                </span>
              </div>
            ))}
          </div>
          <div className="flagband" style={{ marginTop: 16, borderRadius: 4, overflow: "hidden", border: "2px solid rgba(0,0,0,.3)" }}><i /><i /><i /><i /><i /><i /></div>
          <p style={{ textAlign: "center", marginBottom: 0, marginTop: 12, fontWeight: 800, fontSize: 13, opacity: .9 }}>
            Madiba Magic Sweepstake · WC2026
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================ POT (money) ============================ */
function Pot() {
  const [, force] = useState(0);
  const cfg = Store.state.config;
  const pot = Store.potTotal();
  const collected = Store.collected();
  const cur = cfg.currency;
  // one unique, stable line per person — no repeats
  const UNPAID = {
    gav:       "Said ‘remind me later.’ It is later.",
    catherine: "‘Doing it now now.’ Narrator: she was not.",
    kerri:     "Claims the EFT is mysteriously ‘pending.’",
    jay:       "Fairly sure he paid. In 2022. For something else.",
    shafeea:   "Doesn’t follow football. Fully committed to losing money anyway.",
    tara:      "Conveniently unreachable on payday.",
    tom:       "The cash is ‘in the car.’ The car is elsewhere.",
    caroline:  "Three reminders deep, utterly unbothered.",
    ross:      "‘Will sort it after the next game.’ The next game keeps moving.",
    nips:      "Adamant the money was handed over. In cash. To someone. Once.",
  };
  const PAID = {
    gav: "Paid up. Smug about it.", catherine: "Paid. A genuine shock.",
    kerri: "Paid up. Good human.", jay: "Paid, and won’t let it go.",
    shafeea: "Paid before she understood the rules. Legend.", tara: "Paid. No notes.",
    tom: "Paid up. Mark the calendar.", caroline: "Paid. Effortlessly.",
    ross: "Paid up. First time for everything.",
    nips: "Paid in full. Receipts and everything. Show-off.",
  };

  return (
    <div className="wrap grid" style={{ gap: 16, paddingTop: 16 }}>
      <h1 style={{ fontSize: 30 }}>The Pot 💰</h1>

      <div className="card" style={{ background: "var(--gold)" }}>
        <span className="flagband"><i /><i /><i /><i /><i /><i /></span>
        <div className="card-pad between" style={{ alignItems: "flex-end" }}>
          <div>
            <div className="muted" style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 12, letterSpacing: ".1em", whiteSpace: "nowrap" }}>Winner takes all</div>
            <div className="hero-num" style={{ fontSize: 64 }}>{cur}{pot}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <label className="muted" style={{ fontWeight: 800, fontSize: 12, display: "block", textTransform: "uppercase" }}>Buy-in each</label>
            <div className="row" style={{ gap: 4, justifyContent: "flex-end", marginTop: 4 }}>
              <b style={{ fontFamily: "var(--display)", fontSize: 24 }}>{cur}</b>
              <input type="number" min="0" value={cfg.buyIn} readOnly={!window.HOST}
                onChange={e => { Store.setBuyIn(e.target.value); force(x => x + 1); }}
                style={{ width: 90, fontFamily: "var(--display)", fontSize: 24, border: "3px solid var(--ink)", borderRadius: 10, textAlign: "center", background: window.HOST ? "#fff" : "#efe6cf" }} />
            </div>
          </div>
        </div>
      </div>

      <Card title="Who's paid up?" action={<span className="pill" style={{ background: collected === pot ? "var(--green)" : "var(--white)", color: collected === pot ? "#fff" : "var(--ink)" }}>{cur}{collected} / {cur}{pot}</span>}>
        <p className="muted" style={{ fontSize: 13, margin: "0 0 10px" }}>
          We <i>will</i> forget this, exactly like Splitwise. Hence the buttons.
        </p>
        <div className="grid" style={{ gap: 8 }}>
          {WC.PEOPLE.map((p, i) => {
            const paid = !!Store.state.paid[p.id];
            return (
              <div key={p.id} className="between" style={{ padding: "8px 4px", borderBottom: "2px dashed #e7ddc6" }}>
                <div className="row" style={{ gap: 10 }}>
                  <Ava id={p.id} />
                  <div>
                    <b style={{ fontSize: 17 }}>{p.name}</b>
                    {!paid && <div className="muted" style={{ fontSize: 12 }}>{UNPAID[p.id]}</div>}
                    {paid && <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 800 }}>{PAID[p.id]}</div>}
                  </div>
                </div>
                {window.HOST
                  ? <button className={"btn sm " + (paid ? "green" : "")} onClick={() => { Store.togglePaid(p.id); force(x => x + 1); }}>
                      {paid ? "✓ Paid" : "Mark paid"}
                    </button>
                  : <span className={"pill " + (paid ? "green" : "grey")} style={{ fontSize: 11 }}>{paid ? "✓ Paid" : "Unpaid"}</span>}
              </div>
            );
          })}
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 0, marginTop: 12 }}>
          Honesty system. The app can't actually chase anyone — that's still your job, group-chat enforcer.
        </p>
      </Card>

      {window.HOST && (
        <div className="card flat" style={{ borderColor: "var(--red)" }}>
          <div className="card-pad">
            <div className="section-title" style={{ color: "var(--red)" }}><span className="dot" />Host controls</div>
            <p className="muted" style={{ fontSize: 13, margin: "8px 0 10px" }}>
              Wipe the draw, all scores and paid status back to a clean slate — for everyone. Use this after a test run.
            </p>
            <button className="btn red sm" onClick={() => {
              if (confirm("Wipe EVERYTHING — the draw, all scores and paid status — and start from a clean slate? This clears it for everyone.")) { Store.resetAll(); force(x => x + 1); }
            }}>🧹 &nbsp;Reset the whole sweepstake</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, msg }) {
  return (
    <div className="wrap" style={{ paddingTop: 40 }}>
      <div className="card card-pad" style={{ textAlign: "center", maxWidth: 460, margin: "0 auto" }}>
        <div style={{ fontSize: 48 }}>⚽</div>
        <h2 style={{ fontSize: 26, marginTop: 8 }}>{title}</h2>
        <p className="muted" style={{ fontWeight: 600 }}>{msg}</p>
      </div>
    </div>
  );
}

Object.assign(window, { Home, Squads, Pot, EmptyState, nextFixture, teamCodeOf });
