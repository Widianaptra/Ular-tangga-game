const boardEl = document.getElementById("board");
const statusLog = document.getElementById("statusLog");
const turnIndicator = document.getElementById("turnIndicator");
const rollBtn = document.getElementById("rollBtn");
const diceDisplay = document.getElementById("diceDisplay");
const quizModal = document.getElementById("quizModal");
const questionText = document.getElementById("questionText");
const answerOptions = document.getElementById("answerOptions");
const quizInfo = document.getElementById("quizInfo");
const quizFeedback = document.getElementById("quizFeedback");
const gameOverModal = document.getElementById("gameOverModal");
const winnerText = document.getElementById("winnerText");
const finalStats = document.getElementById("finalStats");
const soundCorrect = document.getElementById("soundCorrect");
const soundWrong = document.getElementById("soundWrong");
const soundWin = document.getElementById("soundWin");
const soundBtn = document.getElementById("soundBtn");

const QUIZ_DELAY = 2000;
const ANSWER_REVIEW_DELAY = 3000;
const ladders = {
    5: 9,
    13: 23,
    18: 19,
    28: 34
};
const snakes = {
    15: 11,
    29: 21,
    35: 26
};
const diceImages = [
    "images/1.png",
    "images/2.png",
    "images/3.png",
    "images/4.png",
    "images/5.png",
    "images/6.png"
];
function showDice(number) {
    diceDisplay.src = diceImages[number - 1];
    diceDisplay.alt = `Dadu menunjukkan angka ${number}`;
}
const players = [
    { name: "Pemain 1", pos: 1, className: "p1" },
    { name: "Pemain 2", pos: 1, className: "p2" }
];

let currentPlayer = 0;
let questions = [];
let questionBag = [];
let currentQuestion = null;
let isBusy = false;
let soundEnabled = true;

let stats = {
    correct: 0,
    wrong: 0,
    answered: 0
};

function buildBoard() {
    boardEl.innerHTML = "";
    for (let row = 5; row >= 0; row--) {
    for (let col = 0; col < 6; col++) {
    let number;

    if (row % 2 === 0) {
        number = row * 6 + col + 1;
    } else {
        number = row * 6 + (6 - col);
    }

const cell = document.createElement("div");
cell.className = "cell";
cell.id = `cell-${number}`;

const tokenContainer = document.createElement("div");
tokenContainer.className = "tokens";
tokenContainer.id = `tokens-${number}`;

cell.appendChild(tokenContainer);
boardEl.appendChild(cell);
    }
}

renderTokens();
}

function renderTokens() {
    for (let i = 1; i <= 36; i++) {
        const container = document.getElementById(`tokens-${i}`);

    if (container) {
            container.innerHTML = "";
    }
}

players.forEach((player) => {
const container = document.getElementById(`tokens-${player.pos}`);

    if (container) {
        const token = document.createElement("span");
        token.className = `token ${player.className}`;
        token.textContent = player.className === "p1" ? "1" : "2";
        token.title = player.name;

        container.appendChild(token);
    }
});

document.getElementById("positionP1").textContent =
    `Posisi: ${players[0].pos}`;

document.getElementById("positionP2").textContent =
    `Posisi: ${players[1].pos}`;
}

async function loadQuestions() {
    try {
        const response = await fetch("question.json");

        if (!response.ok) {
            throw new Error("File question.json tidak ditemukan.");
        }

        questions = await response.json();

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("Bank soal masih kosong.");
        }

        refillQuestionBag();

        statusLog.textContent =
            "Soal berhasil dimuat. Pemain 1 dapat memulai permainan.";

        rollBtn.disabled = false;
    } catch (error) {
        console.error(error);

        statusLog.textContent =
            "Bank soal gagal dimuat. Jalankan aplikasi melalui server lokal.";

        rollBtn.disabled = true;
    }
}

function refillQuestionBag() {
    questionBag = [...questions];

    for (let i = questionBag.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));

        [questionBag[i], questionBag[randomIndex]] =
            [questionBag[randomIndex], questionBag[i]];
    }
}

function getRandomQuestion() {
    if (questionBag.length === 0) {
        refillQuestionBag();
    }

    return questionBag.pop();
}

function playSound(audioElement) {
    if (!soundEnabled) return;

    audioElement.currentTime = 0;

    audioElement.play().catch(() => {
    });
}

function rollDice() {
    if (isBusy || questions.length === 0) return;

    isBusy = true;
    rollBtn.disabled = true;
    diceDisplay.classList.add("rolling");

    let count = 0;

const animation = setInterval(() => {
const randomFace = Math.floor(Math.random() * 6) + 1;
showDice(randomFace);

count++;

    if (count >= 10) {
        clearInterval(animation);
        diceDisplay.classList.remove("rolling");

        const dice = Math.floor(Math.random() * 6) + 1;
        showDice(dice);

        movePlayer(dice);
        }
}, 80);
}

function movePlayer(dice) {
    const player = players[currentPlayer];
    const oldPosition = player.pos;

player.pos = Math.min(36, player.pos + dice);
renderTokens();

statusLog.textContent =
    `${player.name} mendapat angka ${dice} dan bergerak dari petak ${oldPosition} ke petak ${player.pos}.`;

setTimeout(() => {
    showQuiz(player);
    }, QUIZ_DELAY);
}

function showQuiz(player) {
    currentQuestion = getRandomQuestion();

    quizInfo.textContent =
        `${player.name} berada di petak ${player.pos}. Pilih satu jawaban yang benar.`;

    questionText.textContent = currentQuestion.q;
    answerOptions.innerHTML = "";
    quizFeedback.textContent = "";
    quizFeedback.className = "feedback";

    currentQuestion.opts.forEach((option, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "answer-option";
        button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;

        button.addEventListener("click", () => {
            evaluateAnswer(index);
        });

        answerOptions.appendChild(button);
    });

    quizModal.classList.remove("hidden");
}

function evaluateAnswer(selectedIndex) {
    if (!currentQuestion) return;

    const buttons = answerOptions.querySelectorAll("button");

    buttons.forEach((button) => {
        button.disabled = true;
    });

    const player = players[currentPlayer];
    const isCorrect = selectedIndex === currentQuestion.ans;

    stats.answered++;

    const landedPosition = player.pos;

    if (isCorrect) {
        stats.correct++;

        buttons[selectedIndex].classList.add("correct-answer");

        quizFeedback.textContent = "Benar! Jawaban kamu tepat.";
        quizFeedback.classList.add("good");

        playSound(soundCorrect);

        if (ladders[landedPosition]) {
            const oldPosition = player.pos;

            player.pos = ladders[landedPosition];

            statusLog.textContent =
                `${player.name} menjawab benar dan naik tangga dari ${oldPosition} ke ${player.pos}.`;
        } else {
            statusLog.textContent =
                `${player.name} menjawab benar dan tetap di petak ${player.pos}, sesuai hasil dadu.`;
        }

    } else {
        stats.wrong++;

        buttons[selectedIndex].classList.add("wrong-answer");
        buttons[currentQuestion.ans].classList.add("correct-answer");

        quizFeedback.textContent =
            `Belum tepat. Jawaban yang benar: ${currentQuestion.opts[currentQuestion.ans]}.`;

        quizFeedback.classList.add("bad");
        playSound(soundWrong);

        player.pos = Math.max(1, player.pos - 1);

        statusLog.textContent =
            `${player.name} menjawab salah dan mundur satu petak.`;
    }

    if (snakes[player.pos]) {
        const oldPosition = player.pos;

        player.pos = snakes[player.pos];

        statusLog.textContent +=
            ` Pemain turun melalui ular dari ${oldPosition} ke ${player.pos}.`;
    }

    renderTokens();

    if (isCorrect && player.pos === 36) {
        setTimeout(() => {
            quizModal.classList.add("hidden");
            showWinner(player);
        }, ANSWER_REVIEW_DELAY);

        return;
    }

    setTimeout(() => {
        quizModal.classList.add("hidden");
        currentQuestion = null;
        switchTurn();
    }, ANSWER_REVIEW_DELAY);
}

function switchTurn() {
    currentPlayer = currentPlayer === 0 ? 1 : 0;

    turnIndicator.textContent =
        `Giliran ${players[currentPlayer].name}`;

    rollBtn.disabled = false;
    isBusy = false;
}

function showWinner(player) {
    playSound(soundWin);

    winnerText.textContent =
        `${player.name} berhasil mencapai petak 36!`;

    finalStats.textContent =
        `Jawaban benar: ${stats.correct} | Jawaban salah: ${stats.wrong}`;

    gameOverModal.classList.remove("hidden");

    rollBtn.disabled = true;
    isBusy = true;
}

function restartGame() {
    players[0].pos = 1;
    players[1].pos = 1;

    currentPlayer = 0;
    isBusy = false;
    currentQuestion = null;

    stats = {
        correct: 0,
        wrong: 0,
        answered: 0
    };

    refillQuestionBag();
    renderTokens();

    diceDisplay.textContent = "🎲";

    turnIndicator.textContent = "Giliran Pemain 1";
    statusLog.textContent =
        "Permainan baru dimulai. Silakan kocok dadu!";

    gameOverModal.classList.add("hidden");
    quizModal.classList.add("hidden");

    showDice(1);
    rollBtn.disabled = false;
}

rollBtn.addEventListener("click", rollDice);

if (soundBtn) {
    soundBtn.addEventListener("click", toggleSound);
}
document.getElementById("restartBtn").addEventListener("click", restartGame);
buildBoard();
loadQuestions();
