window.onload = function () {

    console.log("auth.js loaded");

    const setupModal = document.getElementById("setupModal");
    const saveBtn = document.getElementById("saveProfileBtn");
    const nameInput = document.getElementById("playerNameInput");
    const avatars = document.querySelectorAll(".avatar-option");
    const profileCard = document.getElementById("profileCard");

    let selectedAvatar = "";

    function checkProfile() {
        const profile = JSON.parse(localStorage.getItem("ttb_profile"));

        if (!profile) {
            setupModal.style.display = "flex";
        } else {
            loadProfile(profile);
            setupModal.style.display = "none";
        }
    }

    avatars.forEach(avatar => {
        avatar.addEventListener("click", function () {

            avatars.forEach(a => {
                a.style.border = "2px solid transparent";
            });

            this.style.border = "2px solid #39ff14";
            selectedAvatar = this.src;

            console.log("Avatar selected:", selectedAvatar);
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

        loadProfile(profile);
        setupModal.style.display = "none";
    });

    function loadProfile(profile) {
        document.getElementById("profileAvatar").src = profile.avatar;
        document.getElementById("profileName").textContent = profile.name;
        document.getElementById("profileRating").textContent = profile.rating;

        profileCard.classList.remove("hidden");
    }

    checkProfile();
};
