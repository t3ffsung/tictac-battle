import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

window.onload = function () {

    console.log("auth.js loaded");

    const setupModal = document.getElementById("setupModal");
    const saveBtn = document.getElementById("saveProfileBtn");
    const nameInput = document.getElementById("playerNameInput");
    const avatars = document.querySelectorAll(".avatar-option");
    const profileCard = document.getElementById("profileCard");
    const createRoomBtn = document.getElementById("createRoomBtn");

    let selectedAvatar = "";

    function checkProfile() {
        const profile = JSON.parse(localStorage.getItem("ttb_profile"));

        if (!profile) {
            setupModal.style.display = "flex";
        } else {
            loadProfile(profile);
            setupModal.style.display = "none";
        }
    }

    avatars.forEach(avatar => {
        avatar.addEventListener("click", function () {
            avatars.forEach(a => a.style.border = "2px solid transparent");
            this.style.border = "2px solid #39ff14";
            selectedAvatar = this.src;
        });
    });

    saveBtn.addEventListener("click", function () {

        const name = nameInput.value.trim();

        if (name === "" || selectedAvatar === "") {
            alert("Enter name and select avatar");
            return;
        }

        const profile = {
            id: "user_" + Date.now(),
            name: name,
            avatar: selectedAvatar,
            rating: 1000,
            wins: 0,
            losses: 0,
            draws: 0,
            streak: 0
        };

        localStorage.setItem("ttb_profile", JSON.stringify(profile));
        loadProfile(profile);
        setupModal.style.display = "none";
    });

    function loadProfile(profile) {
        document.getElementById("profileAvatar").src = profile.avatar;
        document.getElementById("profileName").textContent = profile.name;
        document.getElementById("profileRating").textContent = profile.rating;
        profileCard.classList.remove("hidden");
    }

    // 🔥 CREATE ROOM LOGIC
    createRoomBtn.addEventListener("click", function () {

        const profile = JSON.parse(localStorage.getItem("ttb_profile"));
        if (!profile) return;

        const db = window.firebaseDB;

        const roomId = Math.floor(100000 + Math.random() * 900000).toString();

        const roomData = {
            roomId: roomId,
            status: "waiting",
            createdAt: Date.now(),
            players: {
                player1: profile
            }
        };

        set(ref(db, "rooms/" + roomId), roomData)
            .then(() => {
                console.log("Room created:", roomId);
                window.location.href = "game.html?room=" + roomId;
            })
            .catch((error) => {
                console.error("Room creation error:", error);
            });

    });

    checkProfile();
};
