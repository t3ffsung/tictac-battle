// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDWlbjE0Q-BP0_dWSkkJN1sPjpW0qfRVGc",
  authDomain: "tictac-battle.firebaseapp.com",
  projectId: "tictac-battle",
  storageBucket: "tictac-battle.firebasestorage.app",
  messagingSenderId: "238523804333",
  appId: "1:238523804333:web:b63ad913e6ece503d17424",
  databaseURL: "https://tictac-battle-default-rtdb.firebaseio.com"
};

// Initialize
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const database = getDatabase(app);
