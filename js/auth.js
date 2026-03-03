import { database, db } from "./firebase.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { doc, setDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const avatarOptions = document.querySelectorAll(".avatar-option");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const setupModal = document.getElementById("setupModal");
    let selectedAvatar = null;

    avatarOptions.forEach(opt => {
        opt.onclick = (e) => {
            e.preventDefault();
            avatarOptions.forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");
            selectedAvatar = opt.src;
        };
    });

    saveProfileBtn.onclick = async (e) => {
        e.preventDefault();
        const name = document.getElementById("playerNameInput").value.trim();
        if (!name || !selectedAvatar) return alert("Select name and avatar!");

        const id = "p_" + Date.now();
        const profile = { id, name, avatar: selectedAvatar, rating: 1000 };
        
        try {
            localStorage.setItem("playerProfile", JSON.stringify(profile));
            await setDoc(doc(db, "leaderboard", id), profile);
            setupModal.style.display = "none";
            location.reload();
        } catch (error) {
            console.error("Firebase Error:", error);
            setupModal.style.display = "none";
            location.reload();
        }
    };

    if (!localStorage.getItem("playerProfile")) {
        setupModal.style.display = "flex";
    } else {
        const p = JSON.parse(localStorage.getItem("playerProfile"));
        document.getElementById("profileCard").classList.remove("hidden");
        document.getElementById("profileAvatar").src = p.avatar;
        document.getElementById("profileName").innerText = p.name;
        document.getElementById("profileRating").innerText = p.rating;
    }

    document.getElementById("createRoomBtn").onclick = async () => {
        const p = JSON.parse(localStorage.getItem("playerProfile"));
        if (!p) return alert("Create a profile first!");
        if (p.rating < 50) return alert("Insufficient points!");

        const code = Math.random().toString(36).substr(2, 6).toUpperCase();
        await set(ref(database, "rooms/" + code), {
            board: Array(9).fill(""),
            turn: "X", 
            status: "waiting", 
            players: { X: p }
        });
        sessionStorage.setItem("myRole", "X");
        location.href = `game.html?room=${code}`;
    };

    document.getElementById("joinRoomBtn").onclick = async () => {
        const code = document.getElementById("roomCodeInput").value.trim().toUpperCase();
        if (!code) return alert("Enter a room code!");
        
        const p = JSON.parse(localStorage.getItem("playerProfile"));
        const snap = await get(ref(database, "rooms/" + code));
        
        if (!snap.exists()) return alert("Room not found");
        if (snap.val().players.O) return alert("Room is full");

        await set(ref(database, `rooms/${code}/players/O`), p);
        await set(ref(database, `rooms/${code}/status`), "playing");
        sessionStorage.setItem("myRole", "O");
        location.href = `game.html?room=${code}`;
    };

    // FIX 2: Restore Leaderboard functionality
    document.getElementById("leaderboardBtn").onclick = async () => {
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
                list.innerHTML += `<div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.1);">
                    <strong>${d.name}</strong> - ${d.rating} pts
                </div>`;
            });
        } catch (e) {
            list.innerHTML = "Leaderboard currently unavailable.";
        }
    };

    document.getElementById("closeLeaderboard").onclick = () => {
        document.getElementById("leaderboardModal").style.display = "none";
    };
});
