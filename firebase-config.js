/* ============================================================
   firebase-config.js — paste your Firebase web config below.
   Until it's filled in, the app runs in single-device fallback
   mode (works, but doesn't sync between phones).
   ============================================================ */
window.SWEEP_DB = null;
try {
  const firebaseConfig = {
    // <<< PASTE YOUR FIREBASE CONFIG HERE (keep the field names) >>>
    // apiKey: "...",
    // authDomain: "your-project.firebaseapp.com",
    // databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    // projectId: "your-project",
    // appId: "..."
  };
  if (firebaseConfig.databaseURL && window.firebase) {
    firebase.initializeApp(firebaseConfig);
    window.SWEEP_DB = firebase.database().ref("sweep");
    window.SWEEP_CONNECTED_REF = firebase.database().ref(".info/connected");
    console.log("[sweep] Firebase live ✓");
  } else {
    console.warn("[sweep] Firebase not configured yet — running single-device.");
  }
} catch (e) {
  console.warn("[sweep] Firebase init failed:", e.message);
  window.SWEEP_DB = null;
}
