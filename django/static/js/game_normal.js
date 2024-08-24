import PongGame from "./game_builder.js";

let pongGame = null;
let players = null;

function playersFormSubmit() {
    const playersForm = document.getElementById("playersForm");
    if (!playersForm)
        return;

    playersForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const request = new Request(playersForm.action, {
            method: "POST",
            mode: "same-origin",
            headers: {
				'X-CSRFToken': getCSRF()
            },
            body: new URLSearchParams(new FormData(playersForm))
        })

        try {
            const response = await fetch(request);
            const data = await response.json();

            // Yeni hataları göstermeden önce eskilerini temizle
            clearFormErrors();

            if (data.form_errors) {
                showFormErrors(data.form_errors);
            } else {
                players = data.players;
                openTableScreen();
            }

        } catch {
            alert("An unexpected error occurred.");
        }
    })
}

function openTableScreen() {
    const playersScreen = document.getElementById('playersScreen');
    const tableScreen = document.getElementById("tableScreen");
    const player1Name = document.getElementById("player1Name");
    const player2Name = document.getElementById("player2Name");

    if (!playersScreen || !tableScreen || !player1Name || !player2Name)
        return;

    player1Name.textContent = players[0];
    player2Name.textContent = players[1];

    playersScreen.classList.add("d-none");
    tableScreen.classList.remove("d-none");
}

function tableNext() {
    const tableNextButton = document.getElementById("tableNext");
    const tableScreen = document.getElementById("tableScreen");
    const gameCustomizationScreen = document.getElementById("gameCustomizationScreen");

    if (!tableNextButton || !tableScreen || !gameCustomizationScreen)
        return;

    tableNextButton.addEventListener("click", () => {
        tableScreen.classList.add("d-none");
        gameCustomizationScreen.classList.remove("d-none");
    });
}

function tablePrevious() {
    const tablePreviousButton = document.getElementById("tablePrevious");
    const playersScreen = document.getElementById('playersScreen');
    const tableScreen = document.getElementById("tableScreen");

    if (!tablePreviousButton || !playersScreen || !tableScreen)
        return;

    tablePreviousButton.addEventListener("click", () => {
        tableScreen.classList.add("d-none");
        playersScreen.classList.remove("d-none");
    });
}

function gameCustomizationPrevious() {
    const gameCustomizationPreviousButton = document.getElementById("gameCustomizationPrevious");
    const tableScreen = document.getElementById("tableScreen");
    const gameCustomizationScreen = document.getElementById("gameCustomizationScreen");

    if (!gameCustomizationPreviousButton || !tableScreen || !gameCustomizationScreen)
        return;

    gameCustomizationPreviousButton.addEventListener("click", () => {
        gameCustomizationScreen.classList.add("d-none");
        tableScreen.classList.remove("d-none");
    });
}

function startGame() {
    const customizationForm = document.getElementById("customizationForm");
    const gameCustomizationScreen = document.getElementById("gameCustomizationScreen");
    const gameScreen = document.getElementById("gameScreen");
    const gameMenu = document.getElementById("gameMenu");
    const gameCanvas = document.getElementById("gameCanvas");

    if (!customizationForm || !gameScreen || !gameMenu || !gameCanvas)
        return;

    customizationForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);

        const pongGameOptions = {
            player1Color: formData.get("player1Color"),
            player2Color: formData.get("player2Color"),
            ballColor: formData.get("ballColor"),
            groundColor: formData.get("groundColor"),
            sceneColor: formData.get("sceneColor"),
            shadow: formData.has("shadow"),
            sound: formData.has("sound"),
            ballAcceleration: formData.has("ballAcceleration")
        };

        gameCustomizationScreen.classList.add("d-none");
        gameMenu.classList.add("d-none");
        gameScreen.classList.remove("d-none");

        // Oyun başlamadan önce ne olur ne olmaz GameCanvas'ı sıfırla.
        removeAttributes(gameCanvas);

        pongGame = new PongGame(gameCanvas, pongGameOptions, players, winHandler);
        pongGame.start();
    });
}

async function winHandler(winner) {
    const gameScreen = document.getElementById("gameScreen");
    const gameMenu = document.getElementById("gameMenu");
    const winScreen = document.getElementById("winScreen");
    const winningPlayer = document.getElementById("winningPlayer");

    if (!gameScreen || !gameMenu || !winScreen || !winningPlayer)
        return;

    // Oyunun bulunduğu ekranı kapatalım.
    gameScreen.classList.add("d-none");

    // Menu ekranını açıyoruz.
    gameMenu.classList.remove("d-none");

    // Menu da kazanan oyuncu gösteren ekran olmalı.
    winScreen.classList.remove("d-none");

    // Ayrıca kazanan oyuncunun adı ilgili yere yazılmalı.
    winningPlayer.textContent = winner;

    // Oyunu backende gönderiyoruz.
    // Oyunculardan birisi giriş yapan kullanıcı ise oyun kaydedilecektir.
    await saveGameForHistory(players[0], players[1], winner);
}

async function saveGameForHistory(player1, player2, winner) {
    const request = new Request("/game/save/", {
        method: 'POST',
        mode: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
			'X-CSRFToken': getCSRF()
        },
        body: JSON.stringify({
            player1: player1,
            player2: player2,
            winner: winner,
        })
    })

    try {
        const response = await fetch(request);
        const data = await response.json();

        if (!response.ok) {
            alert("An unexpected error occurred. Game completed but not saved.");
            return;
        }

        if (!data.success) {
            alert(`Game completed but not saved: ${data.message}`);
        }
    } catch {
        alert("An unexpected error occurred. Game completed but not saved.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    playersFormSubmit();
    tableNext();
    tablePrevious();
    gameCustomizationPrevious();
    startGame();
})