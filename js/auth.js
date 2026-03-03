import { database } from "./firebase.js";
import {
  ref,
  set,
  get
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {

  const setupModal = document.getElementById("setupModal");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const playerNameInput = document.getElementById("playerNameInput");
  const avatarOptions = document.querySelectorAll(".avatar-option");

  const createRoomBtn = document.getElementById("createRoomBtn");
  const joinRoomBtn = document.getElementById("joinRoomBtn");
  const roomCodeInput = document.getElementById("roomCodeInput");

  const profileCard = document.getElementById("profileCard");
  const profileAvatar = document.getElementById("profileAvatar");
  const profileName = document.getElementById("profileName");

  let selectedAvatar = "";
  let playerData = null;

  // 🔥 Avatar Selection
  avatarOptions.forEach(option => {
    option.addEventListener("click", () => {
      avatarOptions.forEach(o => o.classList.remove("selected"));
      option.classList.add("selected");
      selectedAvatar = option.src;
    });
  });

  // 🔥 Save Profile
  saveProfileBtn.addEventListener("click", () => {
    const name = playerNameInput.value.trim();

    if (!name || !selectedAvatar) {
      alert("Enter name & select avatar");
      return;
    }

    playerData = {
      name: name,
      avatar: selectedAvatar,
      rating: 1000
    };

    localStorage.setItem("playerProfile", JSON.stringify(playerData));

    setupModal.style.display = "none";

    showProfile();
  });

  // 🔥 Show Profile Card
  function showProfile() {
    const saved = JSON.parse(localStorage.getItem("playerProfile"));
    if (!saved) return;

    profileAvatar.src = saved.avatar;
    profileName.textContent = saved.name;
    profileCard.classList.remove("hidden");
  }

  // 🔥 Auto check profile
  if (!localStorage.getItem("playerProfile")) {
    setupModal.style.display = "flex";
  } else {
    showProfile();
  }

  // 🔥 Create Room
  createRoomBtn.addEventListener("click", async () => {
    const roomId = Math.random().toString(36).substring(2, 8);

    const profile = JSON.parse(localStorage.getItem("playerProfile"));

    await set(ref(database, "rooms/" + roomId), {
      createdAt: Date.now(),
      board: ["", "", "", "", "", "", "", "", ""],
      turn: "X",
      players: {
        X: profile
      }
    });

    window.location.href = "/game.html?room=" + roomId;
  });

  // 🔥 Join Room
  joinRoomBtn.addEventListener("click", async () => {
    const roomId = roomCodeInput.value.trim();
    if (!roomId) return;

    const roomRef = ref(database, "rooms/" + roomId);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      alert("Room does not exist");
      return;
    }

    const profile = JSON.parse(localStorage.getItem("playerProfile"));

    await set(ref(database, "rooms/" + roomId + "/players/O"), profile);

    window.location.href = "/game.html?room=" + roomId;
  });

});
