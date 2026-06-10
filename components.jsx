/* ============================================================
   components.jsx — shared building blocks (exported to window)
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;
const WC = window.WC;
const Store = window.Store;

/* ---- South African flag, drawn as SVG (used as the app mark) ---- */
function SAFlag({ w = 60, className = "", style = {} }) {
  const h = w * (2 / 3);
  return (
    <svg className={className} width={w} height={h} viewBox="0 0 60 40"
      style={{ display: "block", border: "1px solid rgba(0,0,0,.25)", ...style }}>
      <rect x="0" y="0" width="60" height="20" fill="#e1392d" />
      <rect x="0" y="20" width="60" height="20" fill="#0050b3" />
      {/* white fimbriation Y */}
      <path d="M-2,-3 L24,20 L62,20 M-2,43 L24,20" stroke="#fff" strokeWidth="16" fill="none" />
      {/* green pall */}
      <path d="M-2,-3 L24,20 L62,20 M-2,43 L24,20" stroke="#007a4d" strokeWidth="10.5" fill="none" />
      {/* hoist triangle: gold then black */}
      <path d="M-1,-2 L20,20 L-1,42 Z" fill="#ffb81c" />
      <path d="M-1,2.5 L14.5,20 L-1,37.5 Z" fill="#101010" />
    </svg>
  );
}

/* ---- ISO 3166-1 alpha-2 codes → reliable flag images (works on every device) ---- */
const ISO_MAP = {
  MEX:"mx", RSA:"za", KOR:"kr", CZE:"cz", CAN:"ca", BIH:"ba", QAT:"qa", SUI:"ch",
  BRA:"br", MAR:"ma", HAI:"ht", SCO:"gb-sct", USA:"us", PAR:"py", AUS:"au", TUR:"tr",
  GER:"de", CUW:"cw", CIV:"ci", ECU:"ec", NED:"nl", JPN:"jp", SWE:"se", TUN:"tn",
  BEL:"be", EGY:"eg", IRN:"ir", NZL:"nz", ESP:"es", CPV:"cv", KSA:"sa", URU:"uy",
  FRA:"fr", SEN:"sn", IRQ:"iq", NOR:"no", ARG:"ar", ALG:"dz", AUT:"at", JOR:"jo",
  POR:"pt", COD:"cd", UZB:"uz", COL:"co", ENG:"gb-eng", CRO:"hr", GHA:"gh", PAN:"pa",
};
/* ---- flag image (unpkg flag-icons) with a tidy code-chip fallback ---- */
function Flag({ code, size = 20 }) {
  const t = WC.TEAM_BY_CODE[code];
  if (!t) return null;
  const h = typeof size === "number" ? size : parseInt(size) || 20;
  const iso = ISO_MAP[code];
  const rid = "fl_" + iso.replace(/-/g, "_");
  const src = (window.__resources && window.__resources[rid]) ||
    `https://unpkg.com/flag-icons@7.2.3/flags/4x3/${iso}.svg`;
  return (
    <img
      src={src}
      alt={t.name}
      loading="eager"
      style={{
        width: Math.round(h * 1.5), height: h, objectFit: "cover",
        borderRadius: Math.max(2, h * 0.12), border: "1px solid rgba(0,0,0,.28)",
        verticalAlign: "middle", background: "#e9e2cf", display: "inline-block",
        boxShadow: "1px 1px 0 rgba(0,0,0,.15)",
      }}
      onError={(e) => {
        const s = document.createElement("span");
        s.textContent = code;
        s.style.cssText = `display:inline-flex;align-items:center;justify-content:center;
          width:${Math.round(h * 1.5)}px;height:${h}px;border-radius:${Math.max(2, h * 0.12)}px;
          border:1px solid rgba(0,0,0,.28);background:var(--navy);color:#fff;
          font-family:var(--display);font-size:${Math.round(h * 0.5)}px;letter-spacing:.02em;
          vertical-align:middle;box-shadow:1px 1px 0 rgba(0,0,0,.15);`;
        e.target.replaceWith(s);
      }}
    />
  );
}

/* ---- one team, inline ---- */
function TeamLine({ code, showGroup, showFav = true, size, bold = true }) {
  const t = WC.TEAM_BY_CODE[code];
  if (!t) return <span className="muted">—</span>;
  return (
    <span className="teamline">
      <Flag code={code} size={size} />
      <span className="nm" style={{ fontWeight: bold ? 800 : 600 }}>{t.name}</span>
      {showFav && t.fav && <span className="fav-star" title="Genuine contender">★</span>}
      {showGroup && <span className="muted" style={{ fontWeight: 700 }}>· {t.group}</span>}
    </span>
  );
}

/* ---- person avatar + chip ---- */
function Ava({ id, sm }) {
  const p = WC.PEOPLE.find(p => p.id === id);
  if (!p) return null;
  return <div className={"ava" + (sm ? " sm" : "")}>{p.emoji}</div>;
}
function PersonChip({ id }) {
  const p = WC.PEOPLE.find(p => p.id === id);
  if (!p) return <span className="muted">Unclaimed</span>;
  return (
    <span className="row" style={{ gap: 7 }}>
      <Ava id={id} sm />
      <b>{p.name}</b>
    </span>
  );
}

/* ---- card scaffold ---- */
function Card({ title, action, children, className = "", pad = true }) {
  return (
    <div className={"card " + className}>
      <span className="flagband"><i /><i /><i /><i /><i /><i /></span>
      {(title || action) && (
        <div className="between" style={{ padding: "12px 16px 0" }}>
          {title && <div className="section-title"><span className="dot" />{title}</div>}
          {action}
        </div>
      )}
      <div className={pad ? "card-pad" : ""}>{children}</div>
    </div>
  );
}

/* ---- confetti burst (flag colours) ---- */
function Confetti({ go }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!go || !ref.current) return;
    const host = ref.current;
    const colors = ["#007a4d", "#ffb81c", "#e1392d", "#0050b3", "#101010", "#ffffff"];
    const pieces = [];
    for (let i = 0; i < 90; i++) {
      const d = document.createElement("div");
      const sz = 7 + Math.random() * 9;
      d.style.cssText = `position:absolute;top:-20px;left:${Math.random() * 100}%;
        width:${sz}px;height:${sz * (0.5 + Math.random())}px;background:${colors[i % colors.length]};
        border:1.5px solid #101010;border-radius:${Math.random() > .5 ? "50%" : "2px"};
        transform:rotate(${Math.random() * 360}deg);opacity:.95;`;
      host.appendChild(d);
      const dur = 1400 + Math.random() * 1400;
      const x = (Math.random() - .5) * 240;
      d.animate(
        [{ transform: d.style.transform, top: "-20px" },
        { transform: `translateX(${x}px) rotate(${Math.random() * 720}deg)`, top: "110%" }],
        { duration: dur, easing: "cubic-bezier(.3,.6,.4,1)", fill: "forwards" }
      );
      pieces.push(d);
    }
    const t = setTimeout(() => pieces.forEach(p => p.remove()), 3200);
    return () => { clearTimeout(t); pieces.forEach(p => p.remove()); };
  }, [go]);
  return <div className="confetti-cell" ref={ref} />;
}

/* ---- date helpers (display in SAST) ---- */
const SAST = "Africa/Johannesburg";
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("en-ZA", { timeZone: SAST, hour: "2-digit", minute: "2-digit", hour12: false });
}
function fmtDay(iso) {
  return new Date(iso).toLocaleDateString("en-ZA", { timeZone: SAST, weekday: "short", day: "numeric", month: "short" });
}
function fmtDayLong(iso) {
  return new Date(iso).toLocaleDateString("en-ZA", { timeZone: SAST, weekday: "long", day: "numeric", month: "long" });
}
function dayKey(iso) {
  return new Date(iso).toLocaleDateString("en-ZA", { timeZone: SAST, year: "numeric", month: "2-digit", day: "2-digit" });
}

/* ---- hidden easter egg: tap the flag in the top bar 7 times ---- */
function EasterEgg({ onClose }) {
  const src = (window.__resources && window.__resources.eidEgg) || "assets/eid-mu.jpg";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,15,10,.82)", zIndex: 90, display: "grid", placeItems: "center", padding: 18 }}>
      <div onClick={e => e.stopPropagation()} className="card pop" style={{ maxWidth: 460, width: "100%", background: "var(--white)", borderColor: "var(--gold)" }}>
        <span className="flagband"><i /><i /><i /><i /><i /><i /></span>
        <div style={{ padding: 18 }}>
          <div className="kicker" style={{ textAlign: "center" }}>You found the secret</div>
          <img src={src} alt="Eid Mu…barack" style={{ width: "100%", borderRadius: 12, border: "3px solid var(--ink)", boxShadow: "4px 4px 0 var(--ink)", marginTop: 10 }} />
          <p style={{ textAlign: "center", fontWeight: 800, margin: "14px 0 4px", fontSize: 15 }}>
            He has been briefed on the sweepstake and declined to comment.
          </p>
          <p className="muted" style={{ textAlign: "center", fontSize: 12.5, margin: 0 }}>
            Tap anywhere to pretend this never happened.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---- dry, deterministic one-line verdict on a person's two teams ---- */
function squadVerdict(codes) {
  const favs = codes.filter(c => (WC.TEAM_BY_CODE[c] || {}).fav).length;
  const hasHost = codes.includes("RSA");
  if (hasHost && favs >= 1) return "Bafana AND a real contender. Suspiciously well-organised.";
  if (hasHost) return "Owns Bafana Bafana. Heart over head, as always.";
  if (favs >= 2) return "Two genuine contenders. Quietly confident, aren't we.";
  if (favs === 1) return "One serious team and one wildcard. Balanced.";
  return "Two teams you'll have to Google. Bold. Respect.";
}

Object.assign(window, {
  SAFlag, Flag, TeamLine, Ava, PersonChip, Card, Confetti, EasterEgg, squadVerdict,
  fmtTime, fmtDay, fmtDayLong, dayKey, SAST,
});
