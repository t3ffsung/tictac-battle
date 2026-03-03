window.onload = function () {

console.log("auth.js loaded");

const setupModal = document.getElementById("setupModal");
const saveBtn = document.getElementById("saveProfileBtn");
const nameInput = document.getElementById("playerNameInput");
const avatars = document.querySelectorAll(".avatar-option");

let selectedAvatar = "";

function checkProfile() {
    const profile = JSON.parse(localStorage.getItem("ttb_profile"));
    if (!profile) {
        setupModal.classList.remove("hidden");
    } else {
        loadProfile(profile);
    }
}

avatars.forEach(avatar => {
    avatar.addEventListener("click", function () {
        avatars.forEach(a => a.style.border = "none");
        avatar.style.border = "2px solid #39ff14";
        selectedAvatar = avatar.src;
    });
});

saveBtn.addEventListener("click", function () {
    console.log("Save clicked");

    const name = nameInput.value.trim();

    if (name === "") {
        alert("Enter your name");
        return;
    }

    if (selectedAvatar === "") {
        alert("Select an avatar");
        return;
    }

    const profile = {
        id: "user_" + Date.now(),
        name: name,
        avatar: selectedAvatar,
        rating: 1000,
        wins: 0,
        losses: 0,
        draws: 0,
        streak: 0
    };

    localStorage.setItem("ttb_profile", JSON.stringify(profile));
    setupModal.classList.add("hidden");
    loadProfile(profile);
});

function loadProfile(profile) {
    document.getElementById("profileAvatar").src = profile.avatar;
    document.getElementById("profileName").textContent = profile.name;
    document.getElementById("profileRating").textContent = profile.rating;
    document.getElementById("profileCard").classList.remove("hidden");
}

checkProfile();

};
