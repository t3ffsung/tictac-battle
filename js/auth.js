// auth.js
import { database, db, auth, provider } from "./firebase.js";
import { signInWithPopup, FacebookAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const fbProvider = new FacebookAuthProvider();

document.addEventListener("DOMContentLoaded", () => {
    const isMuted = localStorage.getItem("audioMuted") === "true";
    const bgm = new Audio("https://actions.google.com/sounds/v1/science_fiction/scifi_groove.ogg");
    bgm.loop = true; bgm.volume = 0.2;
    document.body.addEventListener('click', () => { if (!isMuted && bgm.paused) bgm.play().catch(e => {}); }, { once: true });

    function playClick() { if (!isMuted) new Audio("https://actions.google.com/sounds/v1/ui/button_click.ogg").play(); }

    const themeSelector = document.getElementById("themeSelector");
    if (themeSelector) {
        themeSelector.value = localStorage.getItem("selectedTheme") || "theme-default";
        document.body.className = themeSelector.value;
        themeSelector.onchange = (e) => {
            localStorage.setItem("selectedTheme", e.target.value);
            document.body.className = e.target.value;
        };
    }

    const checkDailyReward = (profile) => {
        const today = new Date().toDateString();
        if (profile.lastLogin !== today) {
            document.getElementById("dailyRewardModal").style.display = "flex";
            document.getElementById("claimRewardBtn").onclick = async () => {
                playClick();
                profile.rating += 500;
                profile.lastLogin = today;
                localStorage.setItem("playerProfile", JSON.stringify(profile));
                await setDoc(doc(db, "leaderboard", profile.id), profile, { merge: true });
                document.getElementById("profileRating").innerText = profile.rating;
                document.getElementById("dailyRewardModal").style.display = "none";
            };
        }
    };

    const handleLogin = async (authProvider) => {
        playClick();
        try {
            const result = await signInWithPopup(auth, authProvider);
            const userRef = doc(db, "leaderboard", result.user.uid);
            const userSnap = await getDoc(userRef);
            let pData = { id: result.user.uid, name: result.user.displayName || "Warrior", avatar: result.user.photoURL || "", rating: 1000, country: "🌍" };
            if (userSnap.exists()) pData = { ...pData, ...userSnap.data() };
            localStorage.setItem("playerProfile", JSON.stringify(pData));
            await setDoc(userRef, pData, { merge: true });
            location.reload();
        } catch (error) { console.error(error); alert("Login failed."); }
    };

    if (document.getElementById("googleSignInBtn")) document.getElementById("googleSignInBtn").onclick = () => handleLogin(provider);
    if (document.getElementById("facebookSignInBtn")) document.getElementById("facebookSignInBtn").onclick = () => handleLogin(fbProvider);
    if (document.getElementById("phoneSignInBtn")) document.getElementById("phoneSignInBtn").onclick = () => alert("Phone Auth requires Recaptcha config. Use Google/Facebook for now.");

    const p = JSON.parse(localStorage.getItem("playerProfile"));
    if (!p) {
        if(document.getElementById("setupModal")) document.getElementById("setupModal").style.display = "flex";
    } else {
        if(document.getElementById("setupModal")) document.getElementById("setupModal").style.display = "none";
        if(document.getElementById("profileCard")) {
            document.getElementById("profileCard").classList.remove("hidden");
            document.getElementById("logoutBtn").classList.remove("hidden");
            document.getElementById("profileAvatar").src = p.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + p.name;
            document.getElementById("profileName").innerText = p.name + " " + (p.country || "");
            document.getElementById("profileRating").innerText = p.rating;
            checkDailyReward(p);
        }
    }

    if(document.getElementById("editProfileBtn")) {
        document.getElementById("editProfileBtn").onclick = async () => {
            playClick();
            const newName = prompt("Enter new name:", p.name) || p.name;
            const newCountry = prompt("Enter country flag emoji (e.g. 🇺🇸):", p.country) || p.country;
            p.name = newName; p.country = newCountry;
            localStorage.setItem("playerProfile", JSON.stringify(p));
            await setDoc(doc(db, "leaderboard", p.id), p, { merge: true });
            location.reload();
        };
    }

    if(document.getElementById("logoutBtn")) document.getElementById("logoutBtn").onclick = async () => { playClick(); await signOut(auth); localStorage.removeItem("playerProfile"); location.reload(); };

    const getBet = () => parseInt(document.getElementById("betAmount")?.value || "50");

    if(document.getElementById("createRoomBtn")) document.getElementById("createRoomBtn").onclick = async () => {
        playClick();
        if (!p) return alert("Sign in first!");
        if (p.rating <= 0 || p.rating < getBet()) return alert("Insufficient points to play!");

        const code = Math.random().toString(36).substr(2, 6).toUpperCase();
        await set(ref(database, "rooms/" + code), { board: Array(9).fill(""), turn: "X", status: "waiting", pot: getBet() * 2, players: { X: p }});
        sessionStorage.setItem("myRole", "X");
        location.href = `game.html?room=${code}`;
    };

    if(document.getElementById("joinRoomBtn")) document.getElementById("joinRoomBtn").onclick = async () => {
        playClick();
        if (!p) return alert("Sign in first!");
        if (p.rating <= 0) return alert("You have 0 points!");
        const code = document.getElementById("roomCodeInput").value.trim().toUpperCase();
        if (!code) return;
        const snap = await get(ref(database, "rooms/" + code));
        if (!snap.exists() || snap.val().players.O) return alert("Room full or not found");
        if (p.rating < (snap.val().pot / 2)) return alert("Not enough points for this room's bet!");

        await set(ref(database, `rooms/${code}/players/O`), p);
        await set(ref(database, `rooms/${code}/status`), "playing");
        sessionStorage.setItem("myRole", "O");
        location.href = `game.html?room=${code}`;
    };

    if(document.getElementById("playBotBtn")) document.getElementById("playBotBtn").onclick = () => {
        playClick();
        sessionStorage.setItem("myRole", "X");
        location.href = "game.html?room=bot";
    };

    // Leaderboard
    if(document.getElementById("leaderboardBtn")) document.getElementById("leaderboardBtn").onclick = async () => {
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
                    <img src="${d.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed='+d.name}" alt="Avatar">
                    <div style="flex-grow:1; text-align:left;"><strong>${d.name} ${d.country || ''}</strong></div>
                    <div style="color:#39ff14;">${d.rating} pts</div>
                </div>`;
            });
        } catch (e) {
            list.innerHTML = "Leaderboard currently unavailable.";
        }
    };

    if(document.getElementById("closeLeaderboard")) document.getElementById("closeLeaderboard").onclick = () => {
        playClick();
        document.getElementById("leaderboardModal").style.display = "none";
    };
});
