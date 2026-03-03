import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

window.onload = function () {

    const db = window.firebaseDB;

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("room");

    const profile = JSON.parse(localStorage.getItem("ttb_profile"));

    if (!roomId || !profile) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("roomCodeDisplay").textContent = roomId;

    const roomRef = ref(db, "rooms/" + roomId);

    onValue(roomRef, (snapshot) => {

        const data = snapshot.val();
        if (!data) return;

        const players = data.players || {};

        if (!players.player2 && profile.id !== players.player1.id) {
            update(roomRef, {
                players: {
                    ...players,
                    player2: profile
                },
                status: "playing"
            });
        }

        if (data.status === "playing") {
            document.getElementById("roomStatus").textContent = "Game Started!";
            initializeBoard(roomRef);
        }

    });

};

function initializeBoard(roomRef) {

    const boardElement = document.getElementById("board");
    boardElement.classList.remove("hidden");

    boardElement.innerHTML = "";

    for (let i = 0; i < 9; i++) {

        const cell = document.createElement("div");
        cell.classList.add("cell");

        const span = document.createElement("span");
        cell.appendChild(span);

        cell.addEventListener("click", function () {

            if (span.textContent !== "") return;

            span.textContent = "X";

        });

        boardElement.appendChild(cell);
    }

}
