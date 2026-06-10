/* ============================================================
   app.jsx — shell, nav, routing, store subscription,
   shared-state hydration, host publishing.
   ============================================================ */
const HOST = !!window.HOST;

/* ---- Publish modal (host only): hand the host the new state.json ---- */
function PublishModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const json = Store.exportState();
  const REPO_RAW = window.PUBLISH_HINT || "your sweepstake repo";

  function copy() {
    navigator.clipboard.writeText(json).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  }
  function download() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "state.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,15,10,.8)", zIndex: 95, display: "grid", placeItems: "center", padding: 14 }}>
      <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 540, width: "100%", maxHeight: "90vh", overflow: "auto", background: "var(--white)", borderColor: "var(--gold)" }}>
        <span className="zig" />
        <div style={{ padding: "16px 18px" }}>
          <div className="kicker">Publish to the family</div>
          <h2 style={{ fontSize: 24, margin: "4px 0 8px" }}>Push the latest state live</h2>
          <p className="muted" style={{ fontSize: 13.5, margin: "0 0 12px" }}>
            This is the shared <code>state.json</code> — the locked draw plus all scores. Three steps and everyone sees it:
          </p>
          <ol style={{ margin: "0 0 12px", paddingLeft: 20, fontSize: 14, lineHeight: 1.6, fontWeight: 600 }}>
            <li><b>Download</b> the file below (it saves as <code>state.json</code>).</li>
            <li>Drop it into the <code>{REPO_RAW}</code> folder, replacing the old one.</li>
            <li>Run <code>./publish.sh</code> (or commit &amp; push). Live in ~1 minute.</li>
          </ol>
          <div className="row" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <button className="btn green sm" onClick={download}>⬇ Download state.json</button>
            <button className="btn gold sm" onClick={copy}>{copied ? "Copied ✓" : "Copy JSON"}</button>
            <button className="btn ghost sm" onClick={onClose}>Close</button>
          </div>
          <textarea readOnly value={json}
            style={{ width: "100%", height: 180, fontFamily: "ui-monospace,monospace", fontSize: 11, border: "2px solid var(--ink)", borderRadius: 10, padding: 10, background: "#fbf4e2", resize: "vertical" }} />
          <p className="muted" style={{ fontSize: 11.5, marginTop: 8, marginBottom: 0 }}>
            Routine match results auto-update for everyone from the live feed — you only need to publish for the draw, knockout winners, or hand-fixed scores.
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState(() => localStorage.getItem("madiba_tab") || "home");
  const [, force] = useState(0);
  const [publish, setPublish] = useState(false);

  // re-render on any store change
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);

  // global hook so any screen can open the publish sheet
  useEffect(() => {
    window.openPublish = () => { if (Store.state.draw.done) Store.lockDraw(); setPublish(true); };
    return () => { delete window.openPublish; };
  }, []);

  function goTo(t) { setTab(t); localStorage.setItem("madiba_tab", t); window.scrollTo({ top: 0 }); }

  const cur = Store.state.config.currency;
  const pot = Store.potTotal();

  const NAV = [
    { id: "home", ic: "🏠", label: "Home" },
    HOST ? { id: "draw", ic: "🎲", label: "Draw" } : null,
    { id: "squads", ic: "👥", label: "Squads" },
    { id: "fixtures", ic: "📅", label: "Fixtures" },
    { id: "standings", ic: "🏆", label: "Race" },
    { id: "pot", ic: "💰", label: "Pot" },
  ].filter(Boolean);

  // if a viewer somehow lands on the draw tab, bounce them home
  const activeTab = (!HOST && tab === "draw") ? "home" : tab;

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
          {HOST && (
            <button className="btn gold sm" style={{ marginLeft: "auto", whiteSpace: "nowrap" }} onClick={() => window.openPublish()}>
              ⬆ Publish
            </button>
          )}
          <div className="pot-pill" onClick={() => goTo("pot")} style={{ cursor: "pointer", marginLeft: HOST ? 8 : "auto" }}>
            <small>Prize pot</small>
            <b>{cur}{pot}</b>
          </div>
        </div>
      </header>

      {/* routed screen */}
      <main>
        {activeTab === "home" && <Home goTo={goTo} />}
        {activeTab === "draw" && HOST && <Draw goTo={goTo} />}
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

      {publish && <PublishModal onClose={() => setPublish(false)} />}
    </div>
  );
}

/* ---- boot: render, then hydrate from the shared state.json + try the live feed ---- */
ReactDOM.createRoot(document.getElementById("root")).render(<App />);

(async function boot() {
  try {
    const res = await fetch("state.json?" + Date.now(), { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      Store.hydrate(json);
    }
  } catch (e) { /* no published state yet — first run */ }
  // Viewers best-effort pull live scores so standings move without a republish (ignored if
  // the feed is unavailable). The host does NOT auto-sync — they stay in control of what gets
  // published, and can pull live scores on demand from the Fixtures tab.
  if (!HOST) { try { await Store.syncLive(); } catch (e) {} }
})();
