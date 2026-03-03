import { database, db } from "./firebase.js";
import { ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const urlParams = new URLSearchParams(location.search);
const roomId = urlParams.get("room");
const myRole = sessionStorage.getItem("myRole");
let profile = JSON.parse(localStorage.getItem("playerProfile"));

if (!roomId || !myRole) window.location.href = "index.html";

const isMuted = localStorage.getItem("audioMuted") === "true";
const bgm = new Audio("https://actions.google.com/sounds/v1/science_fiction/scifi_groove.ogg");
bgm.loop = true; bgm.volume = 0.2;
document.body.addEventListener('click', () => { if (!isMuted && bgm.paused) bgm.play().catch(e => {}); }, { once: true });

function playClick() { if (!isMuted) new Audio("https://actions.google.com/sounds/v1/ui/button_click.ogg").play(); }

document.getElementById("audioToggleBtn").innerText = isMuted ? "🔇 Audio: OFF" : "🔊 Audio: ON";
document.getElementById("audioToggleBtn").onclick = () => { playClick(); localStorage.setItem("audioMuted", !isMuted); location.reload(); };

document.getElementById("displayRoomCode").innerText = roomId;
document.getElementById("exitBtn").onclick = () => { playClick(); remove(ref(database, "rooms/" + roomId)); location.href = "index.html"; };
document.getElementById("exitResultBtn").onclick = () => { playClick(); remove(ref(database, "rooms/" + roomId)); location.href = "index.html"; };

const roomRef = ref(database, "rooms/" + roomId);
const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

onValue(roomRef, async (snap) => {
    const data = snap.val();
    if (!data) return location.href = "index.html"; // Exit if room deleted

    if (data.status === "playing") {
        document.getElementById("lobbyOverlay").style.display = "none";
        document.getElementById("resultModal").style.display = "none";
        document.getElementById("rematchBtn").innerText = "Rematch";
        document.getElementById("winLine").innerHTML = "";
    }
    
    document.getElementById("playerX").innerText = `X: ${data.players.X.name}`;
    if(data.players.O) document.getElementById("playerO").innerText = `O: ${data.players.O.name}`;
    
    data.board.forEach((val, i) => document.querySelector(`[data-index='${i}']`).innerText = val);
    document.getElementById("gameStatus").innerText = data.turn === myRole ? "YOUR TURN" : "WAITING FOR OPPONENT...";

    const win = checkWin(data.board);
    if (win && data.status === "playing") {
        if (win.pattern) drawWinLine(win.pattern);
        if (myRole === "X") update(roomRef, { status: "finished" });

        setTimeout(async () => {
            document.getElementById("resultModal").style.display = "flex";
            if (win.winner === myRole) {
                if(!isMuted) new Audio("https://actions.google.com/sounds/v1/crowds/crowd_cheer.ogg").play();
                document.getElementById("resultTitle").innerText = "🏆 YOU WON!";
                document.getElementById("resultSub").innerText = "+50 Points";
                profile.rating += 50;
            } else if (win.winner === "Tie") {
                document.getElementById("resultTitle").innerText = "🤝 STALEMATE!";
                document.getElementById("resultSub").innerText = "No points lost.";
            } else {
                if(!isMuted) new Audio("https://actions.google.com/sounds/v1/human_voices/crowd_aww.ogg").play();
                document.getElementById("resultTitle").innerText = "💀 DEFEATED!";
                document.getElementById("resultSub").innerText = "-50 Points";
                profile.rating -= 50;
            }
            localStorage.setItem("playerProfile", JSON.stringify(profile));
            await setDoc(doc(db, "leaderboard", profile.id), profile, { merge: true });
        }, 800);
    }

    if (data.status === "finished" && data.rematch?.X && data.rematch?.O && myRole === "X") {
        update(roomRef, { board: Array(9).fill(""), turn: "X", status: "playing", rematch: null });
    }
});

document.getElementById("rematchBtn").onclick = () => {
    playClick();
    document.getElementById("rematchBtn").innerText = "Waiting...";
    update(roomRef, { [`rematch/${myRole}`]: true });
};

function checkWin(b) {
    for (let p of winPatterns) if (b[p[0]] && b[p[0]] === b[p[1]] && b[p[0]] === b[p[2]]) return { winner: b[p[0]], pattern: p };
    return b.includes("") ? null : { winner: "Tie" };
}

function drawWinLine(p) {
    const svg = document.getElementById("winLine");
    const coords = [[50,50,250,50],[50,150,250,150],[50,250,250,250],[50,50,50,250],[150,50,150,250],[250,50,250,250],[50,50,250,250],[250,50,50,250]];
    const idx = winPatterns.findIndex(pattern => JSON.stringify(pattern) === JSON.stringify(p));
    const [x1, y1, x2, y2] = coords[idx];
    svg.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="win-animate" />`;
}

document.querySelectorAll(".cell").forEach(cell => {
    cell.onclick = () => {
        onValue(roomRef, (snap) => {
            const data = snap.val();
            if (data.turn !== myRole || data.board[cell.dataset.index] !== "" || data.status !== "playing") return;
            playClick();
            const nb = [...data.board]; nb[cell.dataset.index] = myRole;
            update(roomRef, { board: nb, turn: myRole === "X" ? "O" : "X" });
        }, { onlyOnce: true });
    };
});
