// game.js
import { database } from "./firebase.js";
import {
  ref,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room");

const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");

const roomRef = ref(database, "rooms/" + roomId);

onValue(roomRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  data.board.forEach((value, index) => {
    cells[index].textContent = value;
  });

  statusText.textContent = "Turn: " + data.turn;
});

cells.forEach((cell, index) => {
  cell.addEventListener("click", () => {
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      if (data.board[index] === "") {
        const newBoard = [...data.board];
        newBoard[index] = data.turn;

        update(roomRef, {
          board: newBoard,
          turn: data.turn === "X" ? "O" : "X"
        });
      }
    }, { onlyOnce: true });
  });
});
