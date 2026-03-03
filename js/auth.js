// auth.js
import { auth, provider, database } from "./firebase.js";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  ref,
  set
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomInput = document.getElementById("roomInput");

loginBtn.onclick = async () => {
  await signInWithPopup(auth, provider);
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    createRoomBtn.style.display = "inline-block";
    joinRoomBtn.style.display = "inline-block";
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    createRoomBtn.style.display = "none";
    joinRoomBtn.style.display = "none";
  }
});

createRoomBtn.onclick = () => {
  const roomId = Math.random().toString(36).substring(2, 8);
  
  set(ref(database, "rooms/" + roomId), {
    createdAt: Date.now(),
    board: ["", "", "", "", "", "", "", "", ""],
    turn: "X"
  });

  window.location.href = "/game.html?room=" + roomId;
};

joinRoomBtn.onclick = () => {
  const roomId = roomInput.value.trim();
  if (roomId !== "") {
    window.location.href = "/game.html?room=" + roomId;
  }
};
