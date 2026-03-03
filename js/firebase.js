import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 🔥 YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDWlbjE0Q-BP0_dWSkkJN1sPjpW0qfRVGc",
  authDomain: "tictac-battle.firebaseapp.com",
  databaseURL: "https://tictac-battle-default-rtdb.firebaseio.com", 
  projectId: "tictac-battle",
  storageBucket: "tictac-battle.firebasestorage.app",
  messagingSenderId: "238523804333",
  appId: "1:238523804333:web:b63ad913e6ece503d17424"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Anonymous Login
signInAnonymously(auth)
  .then(() => {
    console.log("🔥 Firebase connected");
  })
  .catch((error) => {
    console.error("Firebase Auth Error:", error);
  });

// Export globally
window.firebaseApp = app;
window.firebaseDB = db;
