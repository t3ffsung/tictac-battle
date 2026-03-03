import { database, db, auth, provider } from "./firebase.js";
import { signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const isMuted = localStorage.getItem("audioMuted") === "true";
    const bgm = new Audio("https://actions.google.com/sounds/v1/science_fiction/scifi_groove.ogg");
    bgm.loop = true; bgm.volume = 0.2;
    
    document.body.addEventListener('click', () => { if (!isMuted && bgm.paused) bgm.play().catch(e => {}); }, { once: true });

    function playClick() { if (!isMuted) new Audio("https://actions.google.com/sounds/v1/ui/button_click.ogg").play(); }

    const audioBtn = document.getElementById("audioToggleBtn");
    if(audioBtn) {
        audioBtn.innerText = isMuted ? "🔇 Audio: OFF" : "🔊 Audio: ON";
        audioBtn.onclick = () => {
            playClick();
            localStorage.setItem("audioMuted", !isMuted);
            location.reload();
        };
    }

    const setupModal = document.getElementById("setupModal");
    const signInBtn = document.getElementById("googleSignInBtn");

    if (signInBtn) {
        signInBtn.onclick = async (e) => {
            e.preventDefault();
            playClick();
            try {
                const result = await signInWithPopup(auth, provider);
                const userRef = doc(db, "leaderboard", result.user.uid);
                const userSnap = await getDoc(userRef);
                let currentRating = 1000;
                if (userSnap.exists()) currentRating = userSnap.data().rating;

                const profile = { id: result.user.uid, name: result.user.displayName, avatar: result.user.photoURL, rating: currentRating };
                localStorage.setItem("playerProfile", JSON.stringify(profile));
                await setDoc(userRef, profile, { merge: true });
                
                setupModal.style.display = "none";
                location.reload();
            } catch (error) {
                console.error("Auth Error:", error);
                alert("Sign in failed. Check your domain authorization.");
            }
        };
    }

    if (!localStorage.getItem("playerProfile")) {
        setupModal.style.display = "flex";
    } else {
        const p = JSON.parse(localStorage.getItem("playerProfile"));
        document.getElementById("profileCard").classList.remove("hidden");
        document.getElementById("logoutBtn").classList.remove("hidden");
        document.getElementById("profileAvatar").src = p.avatar;
        document.getElementById("profileName").innerText = p.name;
        document.getElementById("profileRating").innerText = p.rating;
    }

    document.getElementById("logoutBtn").onclick = async () => {
        playClick();
        await signOut(auth);
        localStorage.removeItem("playerProfile");
        location.reload();
    };

    document.getElementById("createRoomBtn").onclick = async () => {
        playClick();
        const p = JSON.parse(localStorage.getItem("playerProfile"));
        if (!p) return alert("Sign in first!");
        if (p.rating < 50) return alert("Insufficient points!");

        const code = Math.random().toString(36).substr(2, 6).toUpperCase();
        await set(ref(database, "rooms/" + code), { board: Array(9).fill(""), turn: "X", status: "waiting", players: { X: p }});
        sessionStorage.setItem("myRole", "X");
        location.href = `game.html?room=${code}`;
    };

    document.getElementById("joinRoomBtn").onclick = async () => {
        playClick();
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

    document.getElementById("leaderboardBtn").onclick = async () => {
        playClick();
        const modal = document.getElementById("leaderboardModal");
        const list = document.getElementById("leaderboardList");
        list.innerHTML = "Loading...";
        modal.style.display = "flex";

        try {
            const q = query(collection(db, "leaderboard"), orderBy("rating", "desc"), limit(20));
            const snap = await getDocs(q);
            list.innerHTML = "";
            snap.forEach(doc => {
                const d = doc.data();
                list.innerHTML += `<div class="lb-item">
                    <img src="${d.avatar}" alt="Avatar">
                    <div style="flex-grow:1; text-align:left;"><strong>${d.name}</strong></div>
                    <div style="color:#39ff14;">${d.rating} pts</div>
                </div>`;
            });
        } catch (e) {
            list.innerHTML = "Leaderboard currently unavailable.";
        }
    };

    document.getElementById("closeLeaderboard").onclick = () => {
        playClick();
        document.getElementById("leaderboardModal").style.display = "none";
    };
});
