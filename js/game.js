import { database, db } from "./firebase.js";
import { ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("room");
    const myRole = sessionStorage.getItem("myRole");
    const profile = JSON.parse(localStorage.getItem("playerProfile"));

    if (!roomId || !myRole) return window.location.href = "index.html";

    const roomRef = ref(database, "rooms/" + roomId);
    const cells = document.querySelectorAll(".cell");
    document.getElementById("roomCodeText").textContent = roomId;

    const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

    function checkResult(board) {
        for (let p of winPatterns) {
            if (board[p[0]] && board[p[0]] === board[p[1]] && board[p[0]] === board[p[2]]) return board[p[0]];
        }
        return board.includes("") ? null : "Tie";
    }

    onValue(roomRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        data.board.forEach((v, i) => cells[i].textContent = v);

        const winner = checkResult(data.board);
        if (winner) {
            if (winner === myRole) {
                await updateDoc(doc(db, "leaderboard", profile.id), { rating: increment(25) });
                alert("VICTORY! +25 Rating");
            } else if (winner === "Tie") {
                alert("DRAW!");
            } else {
                alert("DEFEAT!");
            }
            remove(roomRef);
            window.location.href = "index.html";
        }
    });

    cells.forEach((cell, i) => {
        cell.onclick = () => {
            onValue(roomRef, (snap) => {
                const data = snap.val();
                if (data.turn !== myRole || data.board[i] !== "" || data.status !== "playing") return;
                
                const newBoard = [...data.board];
                newBoard[i] = myRole;
                update(roomRef, { board: newBoard, turn: myRole === "X" ? "O" : "X" });
            }, { onlyOnce: true });
        };
    });

    document.getElementById("exitBtn").onclick = () => window.location.href = "index.html";
});
