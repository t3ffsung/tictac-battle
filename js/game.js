import { database, db } from "./firebase.js";
import { ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const urlParams = new URLSearchParams(location.search);
const roomId = urlParams.get("room");
const myRole = sessionStorage.getItem("myRole");
const profile = JSON.parse(localStorage.getItem("playerProfile"));

const roomRef = ref(database, "rooms/" + roomId);
const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

onValue(roomRef, async (snap) => {
    const data = snap.val();
    if (!data) return;

    if (data.status === "playing") document.getElementById("lobbyOverlay").style.display = "none";
    document.getElementById("displayRoomCode").innerText = roomId;
    document.getElementById("playerX").innerText = `X: ${data.players.X.name}`;
    if(data.players.O) document.getElementById("playerO").innerText = `O: ${data.players.O.name}`;
    
    data.board.forEach((val, i) => document.querySelector(`[data-index='${i}']`).innerText = val);
    document.getElementById("gameStatus").innerText = data.turn === myRole ? "YOUR TURN" : "WAITING FOR OPPONENT...";

    const win = checkWin(data.board);
    if (win) {
        if (win.pattern) drawWinLine(win.pattern);
        setTimeout(async () => {
            if (win.winner === myRole) {
                await updateDoc(doc(db, "leaderboard", profile.id), { rating: increment(50) });
                alert("VICTORY! +50 Points Won!");
            } else if (win.winner === "Tie") {
                alert("STALEMATE! No points lost.");
            } else {
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
            const nb = [...data.board]; nb[cell.dataset.index] = myRole;
            update(roomRef, { board: nb, turn: myRole === "X" ? "O" : "X" });
        }, { onlyOnce: true });
    };
});
