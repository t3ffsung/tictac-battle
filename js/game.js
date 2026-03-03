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

// 1. Room Code Display Fix
document.getElementById("displayRoomCode").innerText = roomId;

if(document.getElementById("copyCodeBtn")) {
    document.getElementById("copyCodeBtn").onclick = () => {
        playClick();
        navigator.clipboard.writeText(roomId);
        alert("Code Copied!");
    };
}

// 2. Timer Fix: Only restart when turn changes
let timerInterval;
let currentTurn = "";

function startTimer(turn) {
    clearInterval(timerInterval);
    let timeLeft = 100;
    
    const timerX = document.getElementById("timerX");
    const timerO = document.getElementById("timerO");
    
    timerX.style.transition = "none";
    timerO.style.transition = "none";
    timerX.style.width = turn === "X" ? "100%" : "0%";
    timerO.style.width = turn === "O" ? "100%" : "0%";
    
    // Force CSS reflow to restart animation smoothly
    void timerX.offsetWidth;
    void timerO.offsetWidth;
    
    timerX.style.transition = "width 1s linear";
    timerO.style.transition = "width 1s linear";

    timerInterval = setInterval(() => {
        timeLeft -= 10;
        if(turn === "X") timerX.style.width = `${Math.max(0, timeLeft)}%`;
        if(turn === "O") timerO.style.width = `${Math.max(0, timeLeft)}%`;
        
        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            if(turn === myRole && !isBotMode) {
                // Time's up, automatically skip turn
                update(ref(database, "rooms/" + roomId), { turn: myRole === "X" ? "O" : "X" });
            }
        }
    }, 1000);
}

// 3. Emoji & Chat Fix
function showMsg(id, txt) {
    const el = document.getElementById(id);
    el.innerText = txt; 
    el.classList.remove("hidden");
    el.style.animation = 'none'; 
    void el.offsetWidth; // Trigger CSS reflow
    el.style.animation = 'fadeOut 3s forwards';
    
    if(el.hideTimeout) clearTimeout(el.hideTimeout);
    el.hideTimeout = setTimeout(() => el.classList.add("hidden"), 3000);
}

document.querySelectorAll(".chat-btn").forEach(btn => {
    btn.onclick = () => {
        playClick();
        if(isBotMode) return showMsg("msgX", btn.dataset.msg);
        
        // Single chat object to prevent endless looping
        update(ref(database, "rooms/" + roomId), { 
            lastChat: { sender: myRole, msg: btn.dataset.msg, time: Date.now() }
        });
    };
});

function updateBoardUI(b) { b.forEach((val, i) => document.querySelector(`[data-index='${i}']`).innerText = val); }

const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function checkWin(b) {
    for (let p of winPatterns) if (b[p[0]] && b[p[0]] === b[p[1]] && b[p[0]] === b[p[2]]) return { winner: b[p[0]], pattern: p };
    return b.includes("") ? null : { winner: "Tie" };
}

// 4. Win Line Animation Fix
function drawWinLine(p) {
    if(!p) return;
    const svg = document.getElementById("winLine");
    const coords = [[50,50,250,50],[50,150,250,150],[50,250,250,250],[50,50,50,250],[150,50,150,250],[250,50,250,250],[50,50,250,250],[250,50,50,250]];
    const idx = winPatterns.findIndex(pattern => JSON.stringify(pattern) === JSON.stringify(p));
    if(idx !== -1) {
        const [x1, y1, x2, y2] = coords[idx];
        svg.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="win-animate" />`;
    }
}

function handleWin(win, betAmount) {
    clearInterval(timerInterval);
    if (win.pattern) drawWinLine(win.pattern); 
    
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

let botBoard = Array(9).fill("");
let isGameOver = false;

if (isBotMode) {
    document.getElementById("lobbyOverlay").style.display = "none";
    document.getElementById("playerX").innerText = `X: ${profile.name}`;
    document.getElementById("playerO").innerText = `O: Bot🤖`;
    document.getElementById("potAmount").innerText = "0 (Practice)";
    document.getElementById("chatBox").style.display = "flex";
    
    document.querySelectorAll(".cell").forEach(cell => {
        cell.onclick = () => {
            if (botBoard[cell.dataset.index] !== "" || isGameOver) return;
            playClick();
            botBoard[cell.dataset.index] = "X";
            updateBoardUI(botBoard);
            
            let w = checkWin(botBoard);
            if(w) {
                isGameOver = true;
                return handleWin(w, 0);
            }
            
            setTimeout(() => {
                if(isGameOver) return;
                let empty = botBoard.map((v, i) => v === "" ? i : null).filter(v => v !== null);
                if(empty.length > 0) {
                    botBoard[empty[Math.floor(Math.random() * empty.length)]] = "O";
                    updateBoardUI(botBoard);
                    let bw = checkWin(botBoard);
                    if(bw) {
                        isGameOver = true;
                        handleWin(bw, 0);
                    }
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
            if(!checkWin(data.board)) document.getElementById("winLine").innerHTML = ""; 
        }
        
        document.getElementById("playerX").innerText = `X: ${data.players?.X?.name || 'Wait'}`;
        if(data.players?.O) document.getElementById("playerO").innerText = `O: ${data.players.O.name}`;
        document.getElementById("potAmount").innerText = data.pot || 100;
        
        updateBoardUI(data.board);
        document.getElementById("gameStatus").innerText = data.turn === myRole ? "YOUR TURN (10s)" : "WAITING...";
        
        if (data.status === "playing" && data.turn !== currentTurn) {
            currentTurn = data.turn;
            startTimer(data.turn);
        }

        if(data.lastChat && data.lastChat.time > (window.lastChatTime || 0)) {
            window.lastChatTime = data.lastChat.time;
            showMsg(`msg${data.lastChat.sender}`, data.lastChat.msg);
        }

        const win = checkWin(data.board);
        if (win && data.status === "playing") {
            if (myRole === "X" || (myRole === "O" && win.winner === "O")) {
                update(roomRef, { status: "finished" });
            }
            handleWin(win, data.pot / 2);
        }
        
        if (data.status === "finished" && data.rematch?.X && data.rematch?.O && myRole === "X") {
            update(roomRef, { board: Array(9).fill(""), turn: "X", status: "playing", rematch: null });
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
    
    document.getElementById("rematchBtn").onclick = () => {
        playClick();
        document.getElementById("rematchBtn").innerText = "Waiting...";
        update(roomRef, { [`rematch/${myRole}`]: true });
    };
}

document.getElementById("exitBtn").onclick = () => { playClick(); if(!isBotMode) remove(ref(database, "rooms/" + roomId)); location.href = "index.html"; };
document.getElementById("exitResultBtn").onclick = () => { playClick(); if(!isBotMode) remove(ref(database, "rooms/" + roomId)); location.href = "index.html"; };
