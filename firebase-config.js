/* ============================================================
   firebase-config.js — paste your Firebase web config below.
   Until it's filled in, the app runs in single-device fallback
   mode (works, but doesn't sync between phones).
   ============================================================ */
window.SWEEP_DB = null;
try {
  const firebaseConfig = {
    apiKey: "AIzaSyBOLm3RYC8h7clg-eHtJzWU5ToLtJONuN0",
    authDomain: "sweep-826cc.firebaseapp.com",
    databaseURL: "https://sweep-826cc-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sweep-826cc",
    storageBucket: "sweep-826cc.firebasestorage.app",
    messagingSenderId: "398487021068",
    appId: "1:398487021068:web:974dbeda7baaff3b4ef029"
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
