// game.js
import { database, db } from "./firebase.js";
import { ref, onValue, update, remove, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const urlParams = new URLSearchParams(location.search);
const roomId = urlParams.get("room");
const myRole = sessionStorage.getItem("myRole");
let profile = JSON.parse(localStorage.getItem("playerProfile")) || {name: "Guest", rating: 1000};
let isBotMode = (roomId === "bot");

if (!roomId || !myRole) window.location.href = "index.html";

const isMuted = localStorage.getItem("audioMuted") === "true";
function playClick() { if (!isMuted) new Audio("https://actions.google.com/sounds/v1/ui/button_click.ogg").play(); }

if(document.getElementById("copyCodeBtn")) {
    document.getElementById("copyCodeBtn").onclick = () => {
        playClick();
        navigator.clipboard.writeText(roomId);
        alert("Code Copied!");
    };
}

let timerInterval;
function startTimer(turn) {
    clearInterval(timerInterval);
    let timeLeft = 100; // 10 seconds (100%)
    document.getElementById("timerX").style.width = turn === "X" ? "100%" : "0%";
    document.getElementById("timerO").style.width = turn === "O" ? "100%" : "0%";
    
    if(turn !== myRole || isBotMode) return;
    timerInterval = setInterval(() => {
        timeLeft -= 10;
        document.getElementById(`timer${turn}`).style.width = `${Math.max(0, timeLeft)}%`;
        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            update(ref(database, "rooms/" + roomId), { turn: myRole === "X" ? "O" : "X" }); // Skip turn
        }
    }, 1000);
}

function showMsg(id, txt) {
    const el = document.getElementById(id);
    el.innerText = txt; el.classList.remove("hidden");
    el.style.animation = 'none'; el.offsetHeight; el.style.animation = null;
    setTimeout(() => el.classList.add("hidden"), 3000);
}

document.querySelectorAll(".chat-btn").forEach(btn => {
    btn.onclick = () => {
        playClick();
        if(isBotMode) return showMsg("msgX", btn.dataset.msg);
        update(ref(database, "rooms/" + roomId), { [`chat/${myRole}`]: btn.dataset.msg, chatTime: Date.now() });
    };
});

let botBoard = Array(9).fill("");
if (isBotMode) {
    document.getElementById("lobbyOverlay").style.display = "none";
    document.getElementById("playerX").innerText = `X: ${profile.name}`;
    document.getElementById("playerO").innerText = `O: Bot🤖`;
    document.getElementById("potAmount").innerText = "0 (Practice)";
    document.getElementById("chatBox").style.display = "flex";
    
    document.querySelectorAll(".cell").forEach(cell => {
        cell.onclick = () => {
            if (botBoard[cell.dataset.index] !== "" || checkWin(botBoard)) return;
            playClick();
            botBoard[cell.dataset.index] = "X";
            updateBoardUI(botBoard);
            let w = checkWin(botBoard);
            if(w) return handleWin(w, 0);
            
            setTimeout(() => {
                let empty = botBoard.map((v, i) => v === "" ? i : null).filter(v => v !== null);
                if(empty.length > 0) {
                    botBoard[empty[Math.floor(Math.random() * empty.length)]] = "O";
                    updateBoardUI(botBoard);
                    let bw = checkWin(botBoard);
                    if(bw) handleWin(bw, 0);
                }
            }, 600);
        };
    });
} else {
    const roomRef = ref(database, "rooms/" + roomId);
    onValue(roomRef, async (snap) => {
        const data = snap.val();
        if (!data) return location.href = "index.html"; 

        if (data.status === "playing") {
            document.getElementById("lobbyOverlay").style.display = "none";
            document.getElementById("chatBox").style.display = "flex";
        }
        
        document.getElementById("playerX").innerText = `X: ${data.players?.X?.name || 'Wait'}`;
        if(data.players?.O) document.getElementById("playerO").innerText = `O: ${data.players.O.name}`;
        document.getElementById("potAmount").innerText = data.pot || 100;
        
        updateBoardUI(data.board);
        document.getElementById("gameStatus").innerText = data.turn === myRole ? "YOUR TURN (10s)" : "WAITING...";
        
        startTimer(data.turn);

        if(data.chat && data.chatTime > (window.lastChatTime || 0)) {
            window.lastChatTime = data.chatTime;
            if(data.chat.X) showMsg("msgX", data.chat.X);
            if(data.chat.O) showMsg("msgO", data.chat.O);
        }

        const win = checkWin(data.board);
        if (win && data.status === "playing") {
            clearInterval(timerInterval);
            if (win.pattern) drawWinLine(win.pattern);
            if (myRole === "X") update(roomRef, { status: "finished" });
            handleWin(win, data.pot / 2);
        }
    });

    document.querySelectorAll(".cell").forEach(cell => {
        cell.onclick = () => {
            get(ref(database, "rooms/" + roomId)).then(snap => {
                const data = snap.val();
                if (data.turn !== myRole || data.board[cell.dataset.index] !== "" || data.status !== "playing") return;
                playClick();
                const nb = [...data.board]; nb[cell.dataset.index] = myRole;
                update(ref(database, "rooms/" + roomId), { board: nb, turn: myRole === "X" ? "O" : "X" });
            });
        };
    });
}

function updateBoardUI(b) { b.forEach((val, i) => document.querySelector(`[data-index='${i}']`).innerText = val); }

const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
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

function handleWin(win, betAmount) {
    setTimeout(async () => {
        document.getElementById("resultModal").style.display = "flex";
        if (win.winner === myRole) {
            document.getElementById("resultTitle").innerText = "YOU WON!";
            document.getElementById("resultSub").innerText = `+${betAmount} Points`;
            if(!isBotMode) profile.rating += betAmount;
        } else if (win.winner === "Tie") {
            document.getElementById("resultTitle").innerText = "STALEMATE!";
            document.getElementById("resultSub").innerText = "No points lost.";
        } else {
            document.getElementById("resultTitle").innerText = "DEFEATED!";
            document.getElementById("resultSub").innerText = `-${betAmount} Points`;
            if(!isBotMode) profile.rating -= betAmount;
        }
        if(!isBotMode) {
            localStorage.setItem("playerProfile", JSON.stringify(profile));
            await setDoc(doc(db, "leaderboard", profile.id), profile, { merge: true });
        }
    }, 800);
}

document.getElementById("exitBtn").onclick = () => { playClick(); if(!isBotMode) remove(ref(database, "rooms/" + roomId)); location.href = "index.html"; };
document.getElementById("exitResultBtn").onclick = () => { playClick(); if(!isBotMode) remove(ref(database, "rooms/" + roomId)); location.href = "index.html"; };
