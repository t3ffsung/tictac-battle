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
    avatar.addEventListener("click", () => {
        avatars.forEach(a => a.style.border = "none");
        avatar.style.border = "2px solid #39ff14";
        selectedAvatar = avatar.src;
    });
});

saveBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name || !selectedAvatar) {
        alert("Enter name and select avatar");
        return;
    }

    const profile = {
        id: Date.now().toString(),
        name,
        avatar: selectedAvatar,
        rating: 1000
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
