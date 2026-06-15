/* ============================================================
   app.jsx — shell, nav, routing, live store subscription.
   State is shared live via Firebase (store.js); the draw is open
   to everyone (each person picks on their turn), host edits results.
   ============================================================ */
const HOST = !!window.HOST;

function ConnectingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--green)", color: "var(--gold)", textAlign: "center", padding: 24 }}>
      <div>
        <div style={{ fontSize: 40 }}>🇿🇦</div>
        <div style={{ fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase", letterSpacing: ".08em", marginTop: 10 }}>Connecting to the sweepstake…</div>
        <div style={{ fontSize: 13, opacity: .8, marginTop: 6 }}>one sec</div>
      </div>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState(() => localStorage.getItem("madiba_tab") || "home");
  const [, force] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  // re-render on any store change
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  // don't spin forever if Firebase is slow/misconfigured — show the app after 6s regardless
  useEffect(() => { const t = setTimeout(() => setTimedOut(true), 6000); return () => clearTimeout(t); }, []);

  function goTo(t) { setTab(t); localStorage.setItem("madiba_tab", t); window.scrollTo({ top: 0 }); }

  if (!Store.isReady() && !timedOut) return <ConnectingScreen />;

  const cur = Store.state.config.currency;
  const pot = Store.potTotal() * 2;   // two pots (Pick + Dip)
  const drawStarted = (Store.state.draw.order || []).length > 0 || Store.state.draw.done;

  // Draw tab: host always sees it; everyone sees it once a draw is running or done.
  const NAV = [
    { id: "home", ic: "🏠", label: "Home" },
    (HOST || drawStarted) ? { id: "draw", ic: "🎲", label: "Draw" } : null,
    { id: "squads", ic: "👥", label: "Squads" },
    { id: "fixtures", ic: "📅", label: "Fixtures" },
    { id: "standings", ic: "🏆", label: "Race" },
    { id: "pot", ic: "💰", label: "Pot" },
  ].filter(Boolean);

  const canDraw = HOST || drawStarted;
  const activeTab = (tab === "draw" && !canDraw) ? "home" : tab;

  return (
    <div className="app">
      {/* top bar */}
      <header className="topbar">
        <div className="row">
          <div className="brand" onClick={() => goTo("home")} style={{ cursor: "pointer" }}>
            <SAFlag w={42} className="mark" />
            <div>
              <h1>Madiba Magic</h1>
              <div className="sub">WC 2026 Sweepstake</div>
            </div>
          </div>
          <div className="pot-pill" onClick={() => goTo("pot")} style={{ cursor: "pointer", marginLeft: "auto" }}>
            <small>Two pots</small>
            <b>{cur}{pot}</b>
          </div>
        </div>
      </header>

      {/* routed screen */}
      <main>
        {activeTab === "home" && <Home goTo={goTo} />}
        {activeTab === "draw" && canDraw && <Draw goTo={goTo} />}
        {activeTab === "squads" && <Squads />}
        {activeTab === "fixtures" && <Calendar />}
        {activeTab === "standings" && <Standings />}
        {activeTab === "pot" && <Pot />}
      </main>

      {/* bottom nav */}
      <nav className="nav">
        <div className="inner">
          {NAV.map(n => (
            <button key={n.id} className={activeTab === n.id ? "active" : ""} onClick={() => goTo(n.id)}>
              <span className="ic">{n.ic}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

/* ---- boot: Firebase drives live state. Without it, fall back to a committed state.json. ---- */
(async function boot() {
  if (!Store.isLive()) {
    try {
      const res = await fetch("state.json?" + Date.now(), { cache: "no-store" });
      if (res.ok) Store.hydrate(await res.json());
    } catch (e) { /* no seed file — that's fine */ }
  }

  // The HOST pulls live group scores from ESPN (on load + every few minutes while open) and
  // writes them to the shared state, so everyone sees them. Viewers just read — they never sync.
  // syncLive only ever touches `scores`, never the draw, and only writes when something changed.
  if (HOST) {
    const waitReady = () => new Promise(res => {
      if (Store.isReady()) return res();
      const t = setInterval(() => { if (Store.isReady()) { clearInterval(t); res(); } }, 300);
      setTimeout(() => { clearInterval(t); res(); }, 8000);
    });
    const pull = async () => { try { await Store.syncLive(); } catch (e) { /* feed offline — manual entry still works */ } };
    await waitReady();   // ensure shared state is loaded before merging scores onto it
    await pull();
    setInterval(pull, 4 * 60 * 1000);
  }
})();
