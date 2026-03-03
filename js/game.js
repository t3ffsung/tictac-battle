import { database, db } from "./firebase.js";
import { ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const urlParams = new URLSearchParams(location.search);
const roomId = urlParams.get("room");
const myRole = sessionStorage.getItem("myRole");
let profile = JSON.parse(localStorage.getItem("playerProfile"));

if (!roomId || !myRole) window.location.href = "index.html";

const isMuted = localStorage.getItem("audioMuted") === "true";
const bgm = new Audio("https://actions.google.com/sounds/v1/science_fiction/scifi_groove.ogg");
bgm.loop = true; bgm.volume = 0.2;
if (!isMuted) bgm.play().catch(e => console.log("Auto-play blocked"));

const audioBtn = document.getElementById("audioToggleBtn");
if(audioBtn) {
    audioBtn.innerText = isMuted ? "🔇 Audio: OFF" : "🔊 Audio: ON";
    audioBtn.onclick = () => {
        localStorage.setItem("audioMuted", !isMuted);
        location.reload();
    };
}

document.getElementById("displayRoomCode").innerText = roomId;
document.getElementById("exitBtn").onclick = () => location.href = "index.html";

const roomRef = ref(database, "rooms/" + roomId);
const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

onValue(roomRef, async (snap) => {
    const data = snap.val();
    if (!data) return;

    if (data.status === "playing") document.getElementById("lobbyOverlay").style.display = "none";
    document.getElementById("playerX").innerText = `X: ${data.players.X.name}`;
    if(data.players.O) document.getElementById("playerO").innerText = `O: ${data.players.O.name}`;
    
    data.board.forEach((val, i) => document.querySelector(`[data-index='${i}']`).innerText = val);
    document.getElementById("gameStatus").innerText = data.turn === myRole ? "YOUR TURN" : "WAITING FOR OPPONENT...";

    const win = checkWin(data.board);
    if (win) {
        if (win.pattern) drawWinLine(win.pattern);
        setTimeout(async () => {
            if (win.winner === myRole) {
                if(!isMuted) new Audio("https://actions.google.com/sounds/v1/cartoon/clown_horn.ogg").play();
                profile.rating += 50;
                localStorage.setItem("playerProfile", JSON.stringify(profile));
                await updateDoc(doc(db, "leaderboard", profile.id), { rating: increment(50) });
                alert("VICTORY! +50 Points Won!");
            } else if (win.winner === "Tie") {
                alert("STALEMATE! No points lost.");
            } else {
                if(!isMuted) new Audio("https://actions.google.com/sounds/v1/cartoon/slip_and_crash.ogg").play();
                profile.rating -= 50;
                localStorage.setItem("playerProfile", JSON.stringify(profile));
                await updateDoc(doc(db, "leaderboard", profile.id), { rating: increment(-50) });
                alert("DEFEATED! -50 Points Lost.");
            }
            location.href = "index.html";
        }, 800);
    }
});

function checkWin(b) {
    for (let p of winPatterns) {
        if (b[p[0]] && b[p[0]] === b[p[1]] && b[p[0]] === b[p[2]]) return { winner: b[p[0]], pattern: p };
    }
    return b.includes("") ? null : { winner: "Tie" };
}

function drawWinLine(p) {
    const svg = document.getElementById("winLine");
    const coords = [[50,50,250,50],[50,150,250,150],[50,250,250,250],[50,50,50,250],[150,50,150,250],[250,50,250,250],[50,50,250,250],[250,50,50,250]];
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const idx = winPatterns.findIndex(pattern => JSON.stringify(pattern) === JSON.stringify(p));
    const [x1, y1, x2, y2] = coords[idx];
    line.setAttribute("x1", x1); line.setAttribute("y1", y1); line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.classList.add("win-animate"); svg.appendChild(line);
}

document.querySelectorAll(".cell").forEach(cell => {
    cell.onclick = () => {
        onValue(roomRef, (snap) => {
            const data = snap.val();
            if (data.turn !== myRole || data.board[cell.dataset.index] !== "" || data.status !== "playing") return;
            if (!isMuted) new Audio("https://actions.google.com/sounds/v1/ui/button_click.ogg").play();
            const nb = [...data.board]; nb[cell.dataset.index] = myRole;
            update(roomRef, { board: nb, turn: myRole === "X" ? "O" : "X" });
        }, { onlyOnce: true });
    };
});
