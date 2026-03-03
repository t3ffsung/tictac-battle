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

    avatarOptions.forEach(opt => opt.addEventListener("click", function() {
        avatarOptions.forEach(o => o.classList.remove("selected"));
        this.classList.add("selected");
        selectedAvatar = this.src;
    }));

    saveProfileBtn.addEventListener("click", async () => {
        const name = playerNameInput.value.trim();
        if (!name || !selectedAvatar) return alert("Select name and avatar!");
        
        const profile = { name, avatar: selectedAvatar, rating: 1000, id: Math.random().toString(36).substr(2, 9) };
        localStorage.setItem("playerProfile", JSON.stringify(profile));
        
        // Save to Firestore Leaderboard
        await setDoc(doc(db, "leaderboard", profile.id), profile);
        
        setupModal.style.display = "none";
        showProfile();
    });

    function showProfile() {
        const profile = JSON.parse(localStorage.getItem("playerProfile"));
        if (!profile) return;
        profileAvatar.src = profile.avatar;
        profileName.textContent = profile.name;
        profileRating.textContent = profile.rating;
        profileCard.classList.remove("hidden");
    }

    if (!localStorage.getItem("playerProfile")) setupModal.style.display = "flex";
    else showProfile();

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
        const roomId = document.getElementById("roomCodeInput").value.trim().toUpperCase();
        const snapshot = await get(ref(database, "rooms/" + roomId));
        if (!snapshot.exists() || snapshot.val().players.O) return alert("Invalid Room");
        
        const profile = JSON.parse(localStorage.getItem("playerProfile"));
        await set(ref(database, `rooms/${roomId}/players/O`), profile);
        await set(ref(database, `rooms/${roomId}/status`), "playing");
        
        sessionStorage.setItem("myRole", "O");
        window.location.href = `game.html?room=${roomId}`;
    });

    // Leaderboard Logic
    document.getElementById("leaderboardBtn").addEventListener("click", async () => {
        const q = query(collection(db, "leaderboard"), orderBy("rating", "desc"), limit(5));
        const snap = await getDocs(q);
        const list = document.getElementById("leaderboardList");
        list.innerHTML = "";
        snap.forEach(doc => {
            const data = doc.data();
            list.innerHTML += `<p>${data.name}: ${data.rating} pts</p>`;
        });
        document.getElementById("leaderboardModal").style.display = "flex";
    });

    document.getElementById("closeLeaderboard").onclick = () => {
        document.getElementById("leaderboardModal").style.display = "none";
    };
});
