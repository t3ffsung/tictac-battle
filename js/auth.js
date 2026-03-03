import { database } from "./firebase.js";
import {
  ref,
  set,
  get
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {

  const avatarOptions = document.querySelectorAll(".avatar-option");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const playerNameInput = document.getElementById("playerNameInput");
  const setupModal = document.getElementById("setupModal");

  const createRoomBtn = document.getElementById("createRoomBtn");
  const joinRoomBtn = document.getElementById("joinRoomBtn");
  const roomCodeInput = document.getElementById("roomCodeInput");

  const profileCard = document.getElementById("profileCard");
  const profileAvatar = document.getElementById("profileAvatar");
  const profileName = document.getElementById("profileName");

  let selectedAvatar = null;

  // 🔥 Avatar click logic
  avatarOptions.forEach(option => {
    option.addEventListener("click", function () {

      avatarOptions.forEach(o => o.classList.remove("selected"));

      this.classList.add("selected");

      selectedAvatar = this.getAttribute("src");

      console.log("Selected avatar:", selectedAvatar); // DEBUG
    });
  });

  // 🔥 Save profile
  saveProfileBtn.addEventListener("click", () => {

    const name = playerNameInput.value.trim();

    if (!name) {
      alert("Enter your name");
      return;
    }

    if (!selectedAvatar) {
      alert("Select an avatar");
      return;
    }

    const profile = {
      name: name,
      avatar: selectedAvatar,
      rating: 1000
    };

    localStorage.setItem("playerProfile", JSON.stringify(profile));

    setupModal.style.display = "none";

    showProfile();
  });

  function showProfile() {
    const profile = JSON.parse(localStorage.getItem("playerProfile"));
    if (!profile) return;

    profileAvatar.src = profile.avatar;
    profileName.textContent = profile.name;
    profileCard.classList.remove("hidden");
  }

  // 🔥 Check existing profile
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

    const snapshot = await get(ref(database, "rooms/" + roomId));

    if (!snapshot.exists()) {
      alert("Room not found");
      return;
    }

    const profile = JSON.parse(localStorage.getItem("playerProfile"));

    await set(ref(database, "rooms/" + roomId + "/players/O"), profile);

    window.location.href = "/game.html?room=" + roomId;
  });

});
