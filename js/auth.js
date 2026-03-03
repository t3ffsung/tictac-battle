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

document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const createRoomBtn = document.getElementById("createRoomBtn");
  const joinRoomBtn = document.getElementById("joinRoomBtn");
  const roomInput = document.getElementById("roomInput");
  const avatarSelect = document.getElementById("avatarSelect");

  if (!loginBtn) return; // safety check

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
      if (avatarSelect) avatarSelect.style.display = "inline-block";
    } else {
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      createRoomBtn.style.display = "none";
      joinRoomBtn.style.display = "none";
      if (avatarSelect) avatarSelect.style.display = "none";
    }
  });

  createRoomBtn.onclick = () => {
    const roomId = Math.random().toString(36).substring(2, 8);
    const avatar = avatarSelect ? avatarSelect.value : "default";

    set(ref(database, "rooms/" + roomId), {
      createdAt: Date.now(),
      board: ["", "", "", "", "", "", "", "", ""],
      turn: "X",
      players: {
        X: {
          avatar: avatar
        }
      }
    });

    window.location.href = "/game.html?room=" + roomId;
  };

  joinRoomBtn.onclick = () => {
    const roomId = roomInput.value.trim();
    if (roomId !== "") {
      window.location.href = "/game.html?room=" + roomId;
    }
  };

});
