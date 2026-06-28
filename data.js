/* ============================================================
   MADIBA MAGIC — World Cup 2026 Sweepstake
   data.js — teams, groups, fixtures, people, config (plain JS globals)
   Source: confirmed Final Draw (5 Dec 2025) + official match schedule.
   Kick-off times stored in US Eastern (ET / UTC-4 in June–July) and
   converted to SAST (Africa/Johannesburg) at display time.
   ============================================================ */

/* ---- The 10 family members (pre-loaded, no logins) ---- */
const PEOPLE = [
  { id: "gav",       name: "Gav",       emoji: "🦁" },
  { id: "catherine", name: "Catherine", emoji: "🌺" },
  { id: "kerri",     name: "Kerri",     emoji: "⚡" },
  { id: "jay",       name: "Jay",       emoji: "🎩" },
  { id: "shafeea",   name: "Shafeea",   emoji: "🎲" },
  { id: "tara",      name: "Tara",      emoji: "🌟" },
  { id: "tom",       name: "Tom",       emoji: "🐂" },
  { id: "caroline",  name: "Caroline",  emoji: "🦋" },
  { id: "ross",      name: "Ross",      emoji: "🦅" },
  { id: "nips",      name: "Nips",      emoji: "🦏" },
];

/* ---- Config (editable in-app) ---- */
const CONFIG = {
  buyIn: 50,            // Rand per person
  currency: "R",
  teamsPerPerson: 2,    // 1 chosen in the Pot-1 draft + 1 random from Pot-2
  pot1Picks: 1,         // each person drafts this many in Pot 1 (their choice)
};

/* ---- 48 teams. fav = genuine heavyweight (gets a ⭐ in the draft) ---- */
const TEAMS = [
  // Group A
  { code: "MEX", name: "Mexico",            group: "A", flag: "🇲🇽" },
  { code: "RSA", name: "South Africa",      group: "A", flag: "🇿🇦", home: true },
  { code: "KOR", name: "South Korea",       group: "A", flag: "🇰🇷" },
  { code: "CZE", name: "Czechia",           group: "A", flag: "🇨🇿" },
  // Group B
  { code: "CAN", name: "Canada",            group: "B", flag: "🇨🇦" },
  { code: "BIH", name: "Bosnia & Herz.",    group: "B", flag: "🇧🇦" },
  { code: "QAT", name: "Qatar",             group: "B", flag: "🇶🇦" },
  { code: "SUI", name: "Switzerland",       group: "B", flag: "🇨🇭" },
  // Group C
  { code: "BRA", name: "Brazil",            group: "C", flag: "🇧🇷", fav: true },
  { code: "MAR", name: "Morocco",           group: "C", flag: "🇲🇦" },
  { code: "HAI", name: "Haiti",             group: "C", flag: "🇭🇹" },
  { code: "SCO", name: "Scotland",          group: "C", flag: "🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}" },
  // Group D
  { code: "USA", name: "United States",     group: "D", flag: "🇺🇸" },
  { code: "PAR", name: "Paraguay",          group: "D", flag: "🇵🇾" },
  { code: "AUS", name: "Australia",         group: "D", flag: "🇦🇺" },
  { code: "TUR", name: "Türkiye",           group: "D", flag: "🇹🇷" },
  // Group E
  { code: "GER", name: "Germany",           group: "E", flag: "🇩🇪", fav: true },
  { code: "CUW", name: "Curaçao",           group: "E", flag: "🇨🇼" },
  { code: "CIV", name: "Ivory Coast",       group: "E", flag: "🇨🇮" },
  { code: "ECU", name: "Ecuador",           group: "E", flag: "🇪🇨" },
  // Group F
  { code: "NED", name: "Netherlands",       group: "F", flag: "🇳🇱", fav: true },
  { code: "JPN", name: "Japan",             group: "F", flag: "🇯🇵" },
  { code: "SWE", name: "Sweden",            group: "F", flag: "🇸🇪" },
  { code: "TUN", name: "Tunisia",           group: "F", flag: "🇹🇳" },
  // Group G
  { code: "BEL", name: "Belgium",           group: "G", flag: "🇧🇪", fav: true },
  { code: "EGY", name: "Egypt",             group: "G", flag: "🇪🇬" },
  { code: "IRN", name: "Iran",              group: "G", flag: "🇮🇷" },
  { code: "NZL", name: "New Zealand",       group: "G", flag: "🇳🇿" },
  // Group H
  { code: "ESP", name: "Spain",             group: "H", flag: "🇪🇸", fav: true },
  { code: "CPV", name: "Cape Verde",        group: "H", flag: "🇨🇻" },
  { code: "KSA", name: "Saudi Arabia",      group: "H", flag: "🇸🇦" },
  { code: "URU", name: "Uruguay",           group: "H", flag: "🇺🇾" },
  // Group I
  { code: "FRA", name: "France",            group: "I", flag: "🇫🇷", fav: true },
  { code: "SEN", name: "Senegal",           group: "I", flag: "🇸🇳" },
  { code: "IRQ", name: "Iraq",              group: "I", flag: "🇮🇶" },
  { code: "NOR", name: "Norway",            group: "I", flag: "🇳🇴" },
  // Group J
  { code: "ARG", name: "Argentina",         group: "J", flag: "🇦🇷", fav: true },
  { code: "ALG", name: "Algeria",           group: "J", flag: "🇩🇿" },
  { code: "AUT", name: "Austria",           group: "J", flag: "🇦🇹" },
  { code: "JOR", name: "Jordan",            group: "J", flag: "🇯🇴" },
  // Group K
  { code: "POR", name: "Portugal",          group: "K", flag: "🇵🇹", fav: true },
  { code: "COD", name: "DR Congo",          group: "K", flag: "🇨🇩" },
  { code: "UZB", name: "Uzbekistan",        group: "K", flag: "🇺🇿" },
  { code: "COL", name: "Colombia",          group: "K", flag: "🇨🇴" },
  // Group L
  { code: "ENG", name: "England",           group: "L", flag: "🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", fav: true },
  { code: "CRO", name: "Croatia",           group: "L", flag: "🇭🇷" },
  { code: "GHA", name: "Ghana",             group: "L", flag: "🇬🇭" },
  { code: "PAN", name: "Panama",            group: "L", flag: "🇵🇦" },
];

const TEAM_BY_CODE = Object.fromEntries(TEAMS.map(t => [t.code, t]));
const GROUPS = "ABCDEFGHIJKL".split("");

/* ---- Group-stage fixtures (all 72). t = ET kick-off "HH:MM" ---- */
/* g(group, date, et, home, away, venue, city) */
function g(group, date, et, home, away, venue, city) {
  return { stage: "group", group, date, et, home, away, venue, city };
}
const GROUP_FIXTURES = [
  // Jun 11
  g("A","2026-06-11","15:00","MEX","RSA","Estadio Azteca","Mexico City"),
  g("A","2026-06-11","22:00","KOR","CZE","Estadio Akron","Guadalajara"),
  // Jun 12
  g("B","2026-06-12","15:00","CAN","BIH","BMO Field","Toronto"),
  g("D","2026-06-12","21:00","USA","PAR","SoFi Stadium","Los Angeles"),
  // Jun 13
  g("B","2026-06-13","15:00","QAT","SUI","Levi's Stadium","San Francisco Bay"),
  g("C","2026-06-13","18:00","BRA","MAR","MetLife Stadium","New York / NJ"),
  g("C","2026-06-13","21:00","HAI","SCO","Gillette Stadium","Boston"),
  // Jun 14
  g("D","2026-06-14","00:00","AUS","TUR","BC Place","Vancouver"),
  g("E","2026-06-14","13:00","GER","CUW","NRG Stadium","Houston"),
  g("F","2026-06-14","16:00","NED","JPN","AT&T Stadium","Dallas"),
  g("E","2026-06-14","19:00","CIV","ECU","Lincoln Financial Field","Philadelphia"),
  g("F","2026-06-14","22:00","SWE","TUN","Estadio BBVA","Monterrey"),
  // Jun 15
  g("H","2026-06-15","12:00","ESP","CPV","Mercedes-Benz Stadium","Atlanta"),
  g("G","2026-06-15","15:00","BEL","EGY","Lumen Field","Seattle"),
  g("H","2026-06-15","18:00","KSA","URU","Hard Rock Stadium","Miami"),
  g("G","2026-06-15","21:00","IRN","NZL","SoFi Stadium","Los Angeles"),
  // Jun 16
  g("I","2026-06-16","15:00","FRA","SEN","MetLife Stadium","New York / NJ"),
  g("I","2026-06-16","18:00","IRQ","NOR","Gillette Stadium","Boston"),
  g("J","2026-06-16","21:00","ARG","ALG","Arrowhead Stadium","Kansas City"),
  // Jun 17
  g("J","2026-06-17","00:00","AUT","JOR","Levi's Stadium","San Francisco Bay"),
  g("K","2026-06-17","13:00","POR","COD","NRG Stadium","Houston"),
  g("L","2026-06-17","16:00","ENG","CRO","AT&T Stadium","Dallas"),
  g("L","2026-06-17","19:00","GHA","PAN","BMO Field","Toronto"),
  g("K","2026-06-17","22:00","UZB","COL","Estadio Azteca","Mexico City"),
  // Jun 18
  g("A","2026-06-18","12:00","CZE","RSA","Mercedes-Benz Stadium","Atlanta"),
  g("B","2026-06-18","15:00","SUI","BIH","SoFi Stadium","Los Angeles"),
  g("B","2026-06-18","18:00","CAN","QAT","BC Place","Vancouver"),
  g("A","2026-06-18","21:00","MEX","KOR","Estadio Akron","Guadalajara"),
  // Jun 19
  g("D","2026-06-19","15:00","USA","AUS","Lumen Field","Seattle"),
  g("C","2026-06-19","18:00","SCO","MAR","Gillette Stadium","Boston"),
  g("C","2026-06-19","20:30","BRA","HAI","Lincoln Financial Field","Philadelphia"),
  g("D","2026-06-19","23:00","TUR","PAR","Levi's Stadium","San Francisco Bay"),
  // Jun 20
  g("F","2026-06-20","13:00","NED","SWE","NRG Stadium","Houston"),
  g("E","2026-06-20","16:00","GER","CIV","BMO Field","Toronto"),
  g("E","2026-06-20","20:00","ECU","CUW","Arrowhead Stadium","Kansas City"),
  // Jun 21
  g("F","2026-06-21","00:00","TUN","JPN","Estadio BBVA","Monterrey"),
  g("H","2026-06-21","12:00","ESP","KSA","Mercedes-Benz Stadium","Atlanta"),
  g("G","2026-06-21","15:00","BEL","IRN","SoFi Stadium","Los Angeles"),
  g("H","2026-06-21","18:00","URU","CPV","Hard Rock Stadium","Miami"),
  g("G","2026-06-21","21:00","NZL","EGY","BC Place","Vancouver"),
  // Jun 22
  g("J","2026-06-22","13:00","ARG","AUT","AT&T Stadium","Dallas"),
  g("I","2026-06-22","17:00","FRA","IRQ","Lincoln Financial Field","Philadelphia"),
  g("I","2026-06-22","20:00","NOR","SEN","MetLife Stadium","New York / NJ"),
  g("J","2026-06-22","23:00","JOR","ALG","Levi's Stadium","San Francisco Bay"),
  // Jun 23
  g("K","2026-06-23","13:00","POR","UZB","NRG Stadium","Houston"),
  g("L","2026-06-23","16:00","ENG","GHA","Gillette Stadium","Boston"),
  g("L","2026-06-23","19:00","PAN","CRO","BMO Field","Toronto"),
  g("K","2026-06-23","22:00","COL","COD","Estadio Akron","Guadalajara"),
  // Jun 24
  g("B","2026-06-24","15:00","SUI","CAN","BC Place","Vancouver"),
  g("B","2026-06-24","15:00","BIH","QAT","Lumen Field","Seattle"),
  g("C","2026-06-24","18:00","SCO","BRA","Hard Rock Stadium","Miami"),
  g("C","2026-06-24","18:00","MAR","HAI","Mercedes-Benz Stadium","Atlanta"),
  g("A","2026-06-24","21:00","CZE","MEX","Estadio Azteca","Mexico City"),
  g("A","2026-06-24","21:00","RSA","KOR","Estadio BBVA","Monterrey"),
  // Jun 25
  g("E","2026-06-25","16:00","CUW","CIV","Lincoln Financial Field","Philadelphia"),
  g("E","2026-06-25","16:00","ECU","GER","MetLife Stadium","New York / NJ"),
  g("F","2026-06-25","19:00","JPN","SWE","AT&T Stadium","Dallas"),
  g("F","2026-06-25","19:00","TUN","NED","Arrowhead Stadium","Kansas City"),
  g("D","2026-06-25","22:00","TUR","USA","SoFi Stadium","Los Angeles"),
  g("D","2026-06-25","22:00","PAR","AUS","Levi's Stadium","San Francisco Bay"),
  // Jun 26
  g("I","2026-06-26","15:00","NOR","FRA","Gillette Stadium","Boston"),
  g("I","2026-06-26","15:00","SEN","IRQ","BMO Field","Toronto"),
  g("H","2026-06-26","20:00","CPV","KSA","NRG Stadium","Houston"),
  g("H","2026-06-26","20:00","URU","ESP","Estadio Akron","Guadalajara"),
  g("G","2026-06-26","23:00","EGY","IRN","Lumen Field","Seattle"),
  g("G","2026-06-26","23:00","NZL","BEL","BC Place","Vancouver"),
  // Jun 27
  g("L","2026-06-27","17:00","PAN","ENG","MetLife Stadium","New York / NJ"),
  g("L","2026-06-27","17:00","CRO","GHA","Lincoln Financial Field","Philadelphia"),
  g("K","2026-06-27","19:30","COL","POR","Hard Rock Stadium","Miami"),
  g("K","2026-06-27","19:30","COD","UZB","Mercedes-Benz Stadium","Atlanta"),
  g("J","2026-06-27","22:00","ALG","AUT","Arrowhead Stadium","Kansas City"),
  g("J","2026-06-27","22:00","JOR","ARG","AT&T Stadium","Dallas"),
];

/* ---- Knockout structure (Round of 32 → Final). Slots fill from results. ----
   home/away here are SLOT labels until determined:
   "1A" = winner group A, "2A" = runner-up A, "3?" = a best-third-place team. */
function k(stage, num, date, et, home, away, venue, city) {
  return { stage, num, date, et, home, away, venue, city, slot: true };
}
const KO_FIXTURES = [
  // Round of 32 (Jun 28 – Jul 3)
  k("R32",73,"2026-06-28","15:00","2A","2B","SoFi Stadium","Inglewood"),
  k("R32",74,"2026-06-29","16:30","1E","3?","Gillette Stadium","Foxborough"),
  k("R32",75,"2026-06-29","21:00","1F","2C","Estadio BBVA","Guadalupe"),
  k("R32",76,"2026-06-29","13:00","1C","2F","NRG Stadium","Houston"),
  k("R32",77,"2026-06-30","17:00","1I","3?","MetLife Stadium","East Rutherford"),
  k("R32",78,"2026-06-30","13:00","2E","2I","AT&T Stadium","Arlington"),
  k("R32",79,"2026-06-30","21:00","1A","3?","Estadio Banorte","Mexico City"),
  k("R32",80,"2026-07-01","12:00","1L","3?","Mercedes-Benz Stadium","Atlanta"),
  k("R32",81,"2026-07-01","20:00","1D","3?","Levi's Stadium","Santa Clara"),
  k("R32",82,"2026-07-01","16:00","1G","3?","Lumen Field","Seattle"),
  k("R32",83,"2026-07-02","19:00","2K","2L","BMO Field","Toronto"),
  k("R32",84,"2026-07-02","15:00","1H","2J","SoFi Stadium","Inglewood"),
  k("R32",85,"2026-07-02","23:00","1B","3?","BC Place","Vancouver"),
  k("R32",86,"2026-07-03","18:00","1J","2H","Hard Rock Stadium","Miami Gardens"),
  k("R32",87,"2026-07-03","21:30","1K","3?","GEHA Field at Arrowhead Stadium","Kansas City"),
  k("R32",88,"2026-07-03","14:00","2D","2G","AT&T Stadium","Arlington"),
  // Round of 16 (Jul 4 – 7)
  k("R16",89,"2026-07-04","17:00","W74","W77","Lincoln Financial Field","Philadelphia"),
  k("R16",90,"2026-07-04","13:00","W73","W75","NRG Stadium","Houston"),
  k("R16",91,"2026-07-05","16:00","W76","W78","MetLife Stadium","East Rutherford"),
  k("R16",92,"2026-07-05","20:00","W79","W80","Estadio Banorte","Mexico City"),
  k("R16",93,"2026-07-06","15:00","W83","W84","AT&T Stadium","Arlington"),
  k("R16",94,"2026-07-06","20:00","W81","W82","Lumen Field","Seattle"),
  k("R16",95,"2026-07-07","12:00","W86","W88","Mercedes-Benz Stadium","Atlanta"),
  k("R16",96,"2026-07-07","16:00","W85","W87","BC Place","Vancouver"),
  // Quarter-finals (Jul 9 – 11)
  k("QF",97,"2026-07-09","16:00","W89","W90","Gillette Stadium","Foxborough"),
  k("QF",98,"2026-07-10","15:00","W93","W94","SoFi Stadium","Inglewood"),
  k("QF",99,"2026-07-11","17:00","W91","W92","Hard Rock Stadium","Miami Gardens"),
  k("QF",100,"2026-07-11","21:00","W95","W96","GEHA Field at Arrowhead Stadium","Kansas City"),
  // Semi-finals (Jul 14 – 15)
  k("SF",101,"2026-07-14","15:00","W97","W98","AT&T Stadium","Arlington"),
  k("SF",102,"2026-07-15","15:00","W99","W100","Mercedes-Benz Stadium","Atlanta"),
  // Third place (Jul 18) & Final (Jul 19)
  k("3RD",103,"2026-07-18","17:00","L101","L102","Hard Rock Stadium","Miami Gardens"),
  k("FINAL",104,"2026-07-19","15:00","W101","W102","MetLife Stadium","East Rutherford"),
];

const FIXTURES = GROUP_FIXTURES.concat(KO_FIXTURES);
// stamp ids + UTC datetime (ET is UTC-4 in Jun/Jul)
FIXTURES.forEach((f, i) => {
  f.id = "m" + (i + 1);
  f.kickoff = new Date(`${f.date}T${f.et}:00-04:00`).toISOString();
});

const STAGE_LABEL = {
  group: "Group Stage", R32: "Round of 32", R16: "Round of 16",
  QF: "Quarter-final", SF: "Semi-final", "3RD": "Third-place", FINAL: "FINAL",
};

window.WC = { PEOPLE, CONFIG, TEAMS, TEAM_BY_CODE, GROUPS, FIXTURES, GROUP_FIXTURES, KO_FIXTURES, STAGE_LABEL };
