import { database } from "./firebase.js";
import {
  ref,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {

  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("room");

  if (!roomId) {
    window.location.href = "/";
    return;
  }

  const roomRef = ref(database, "rooms/" + roomId);

  const roomCodeDisplay = document.querySelector(".room-code-text");

  if (roomCodeDisplay) {
    roomCodeDisplay.textContent = roomId;
  }

  const cells = document.querySelectorAll(".cell");

  onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (data.board && cells.length === 9) {
      data.board.forEach((value, index) => {
        if (cells[index]) {
          cells[index].textContent = value;
        }
      });
    }
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

});
