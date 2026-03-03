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

  // 🔥 Show Room Code
  const roomCodeText = document.getElementById("roomCodeText");
  roomCodeText.textContent = roomId;

  // 🔥 Exit Button
  const exitBtn = document.getElementById("exitBtn");
  exitBtn.addEventListener("click", () => {
    window.location.href = "/";
  });

  const cells = document.querySelectorAll(".cell");

  // 🔥 Listen for board changes
  onValue(roomRef, (snapshot) => {

    const data = snapshot.val();

    if (!data) return;

    if (!data.board) return;

    data.board.forEach((value, index) => {
      cells[index].textContent = value;
    });

  });

  // 🔥 Cell click logic
  cells.forEach((cell, index) => {

    cell.addEventListener("click", () => {

      onValue(roomRef, (snapshot) => {

        const data = snapshot.val();
        if (!data) return;

        if (data.board[index] !== "") return;

        const newBoard = [...data.board];
        newBoard[index] = data.turn;

        update(roomRef, {
          board: newBoard,
          turn: data.turn === "X" ? "O" : "X"
        });

      }, { onlyOnce: true });

    });

  });

});
