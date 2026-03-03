import { database, db } from "./firebase.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { collection, query, orderBy, limit, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const avatarOptions = document.querySelectorAll(".avatar-option");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const playerNameInput = document.getElementById("playerNameInput");
    const setupModal = document.getElementById("setupModal");
    const profileCard = document.getElementById("profileCard");
    const profileAvatar = document.getElementById("profileAvatar");
    const profileName = document.getElementById("profileName");
    const profileRating = document.getElementById("profileRating");

    let selectedAvatar = null;

    // Avatar Selection
    avatarOptions.forEach(opt => {
        opt.addEventListener("click", function() {
            avatarOptions.forEach(o => o.classList.remove("selected"));
            this.classList.add("selected");
            selectedAvatar = this.src;
        });
    });

    // FIX: Save Button Logic
    saveProfileBtn.addEventListener("click", async () => {
        const name = playerNameInput.value.trim();
        
        if (!name) return alert("Please enter a name!");
        if (!selectedAvatar) return alert("Please select an avatar!");

        const playerStats = {
            name: name,
            avatar: selectedAvatar,
            rating: 1000,
            id: 'p_' + Math.random().toString(36).substr(2, 9)
        };

        try {
            // Save locally first so button "works" even if DB fails
            localStorage.setItem("playerProfile", JSON.stringify(playerStats));
            
            // Try saving to Firestore for Global Leaderboard
            await setDoc(doc(db, "leaderboard", playerStats.id), playerStats);
            
            setupModal.style.display = "none";
            showProfile();
        } catch (error) {
            console.error("Firestore Error:", error);
            // If Firestore fails (permissions), we still let them play locally
            setupModal.style.display = "none";
            showProfile();
        }
    });

    function showProfile() {
        const profile = JSON.parse(localStorage.getItem("playerProfile"));
        if (!profile) return;
        profileAvatar.src = profile.avatar;
        profileName.textContent = profile.name;
        profileRating.textContent = profile.rating;
        profileCard.classList.remove("hidden");
    }

    if (!localStorage.getItem("playerProfile")) {
        setupModal.style.display = "flex";
    } else {
        showProfile();
    }

    // Lobby Buttons
    document.getElementById("createRoomBtn").addEventListener("click", async () => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const profile = JSON.parse(localStorage.getItem("playerProfile"));
        
        await set(ref(database, "rooms/" + roomId), {
            board: Array(9).fill(""),
            turn: "X",
            status: "waiting",
            players: { X: profile }
        });

        sessionStorage.setItem("myRole", "X");
        window.location.href = `game.html?room=${roomId}`;
    });

    document.getElementById("joinRoomBtn").addEventListener("click", async () => {
        const code = document.getElementById("roomCodeInput").value.trim().toUpperCase();
        if (!code) return alert("Enter a code!");

        const snapshot = await get(ref(database, "rooms/" + code));
        if (!snapshot.exists()) return alert("Room not found!");
        
        const data = snapshot.val();
        if (data.players.O) return alert("Room is full!");

        const profile = JSON.parse(localStorage.getItem("playerProfile"));
        await set(ref(database, `rooms/${code}/players/O`), profile);
        await set(ref(database, `rooms/${code}/status`), "playing");

        sessionStorage.setItem("myRole", "O");
        window.location.href = `game.html?room=${code}`;
    });

    // Leaderboard Toggle
    document.getElementById("leaderboardBtn").addEventListener("click", async () => {
        const modal = document.getElementById("leaderboardModal");
        const list = document.getElementById("leaderboardList");
        list.innerHTML = "Loading...";
        modal.style.display = "flex";

        try {
            const q = query(collection(db, "leaderboard"), orderBy("rating", "desc"), limit(5));
            const snap = await getDocs(q);
            list.innerHTML = "";
            snap.forEach(doc => {
                const d = doc.data();
                list.innerHTML += `<div class="lb-item"><strong>${d.name}</strong>: ${d.rating}</div>`;
            });
        } catch (e) {
            list.innerHTML = "Leaderboard currently unavailable.";
        }
    });

    document.getElementById("closeLeaderboard").onclick = () => {
        document.getElementById("leaderboardModal").style.display = "none";
    };
});
