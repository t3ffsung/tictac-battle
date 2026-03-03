import { db } from "./firebase.js";
import { ref, onValue, update, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

window.onload = function () {

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("room");

    const profile = JSON.parse(localStorage.getItem("ttb_profile"));

    if (!roomId || !profile) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("roomCodeDisplay").textContent = roomId;

    const roomRef = ref(db, "rooms/" + roomId);

    let playerSymbol = "";
    let currentTurn = "X";

    // Listen to room
    onValue(roomRef, (snapshot) => {

        const data = snapshot.val();
        if (!data) return;

        let players = data.players || {};

        // Assign player2 if empty
        if (!players.player2 && profile.id !== players.player1.id) {
            players.player2 = profile;
            update(roomRef, {
                players: players,
                status: "playing",
                board: ["","","","","","","","",""],
                turn: "X"
            });
            return;
        }

        if (players.player1.id === profile.id) {
            playerSymbol = "X";
        } else if (players.player2 && players.player2.id === profile.id) {
            playerSymbol = "O";
        }

        if (data.status === "playing") {
            document.getElementById("roomStatus").textContent =
                data.turn === playerSymbol ? "Your Turn" : "Opponent's Turn";

            currentTurn = data.turn;
            renderBoard(data.board || ["","","","","","","","",""], roomRef, playerSymbol, currentTurn);
        }

    });

};

function renderBoard(boardState, roomRef, playerSymbol, currentTurn) {

    const boardElement = document.getElementById("board");
    boardElement.classList.remove("hidden");
    boardElement.innerHTML = "";

    boardState.forEach((value, index) => {

        const cell = document.createElement("div");
        cell.classList.add("cell");

        const span = document.createElement("span");
        span.textContent = value;
        cell.appendChild(span);

        cell.addEventListener("click", function () {

            if (value !== "") return;
            if (playerSymbol !== currentTurn) return;

            const newBoard = [...boardState];
            newBoard[index] = playerSymbol;

            update(roomRef, {
                board: newBoard,
                turn: playerSymbol === "X" ? "O" : "X"
            });

        });

        boardElement.appendChild(cell);

    });

}
