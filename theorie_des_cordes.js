const canvas = document.getElementById("stringCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const stabilityDisplay = document.getElementById("stability");
const infoTitle = document.getElementById("infoTitle");
const infoText = document.getElementById("infoText");
const resetBtn = document.getElementById("resetBtn");

let score = 0;
let stability = 100;
let gameOver = false;
let gameTime = 0;

let currentHarmonic = 1; 
const dimensions = ["4D (Espace Standard)", "10D (Supercordes)", "11D (Théorie M)"];
let currentDimIndex = 0; 

const targetsData = [
    { name: "Photon", harmonic: 1, dimIndex: 1, color: "#ffeaa7", desc: "Masse nulle. Vibration basse dans les 10 dimensions de la théorie des cordes." },
    { name: "Quark Top", harmonic: 2, dimIndex: 1, color: "#ff7675", desc: "Très massif. Nécessite une harmonique d'excitation plus élevée en 10D." },
    { name: "Graviton", harmonic: 3, dimIndex: 2, color: "#00ffcc", desc: "Vecteur de la gravité. Selon la Théorie M, c'est une corde fermée qui peut voyager dans la 11e dimension !" }
];

let activeTargets = [];
let spawnTimer = 0;

// --- CENTRALISATION DES COMMANDES (Clavier + Tactile) ---
function handleInput(action) {
    if (gameOver) return;

    if (action === "up") {
        currentHarmonic = Math.min(3, currentHarmonic + 1);
    }
    if (action === "down") {
        currentHarmonic = Math.max(1, currentHarmonic - 1);
    }
    if (action === "right") {
        currentDimIndex = Math.min(2, currentDimIndex + 1);
    }
    if (action === "left") {
        currentDimIndex = Math.max(0, currentDimIndex - 1);
    }
    updateStringInfo();
}

// Écouteur du Clavier PC
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") handleInput("up");
    if (e.key === "ArrowDown") handleInput("down");
    if (e.key === "ArrowRight") handleInput("right");
    if (e.key === "ArrowLeft") handleInput("left");
});

// Configuration des Boutons Tactiles Mobiles
function setupMobileButton(buttonId, action) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener("touchstart", (e) => {
        e.preventDefault(); // Empêche le zoom/scroll forcé sur mobile
        handleInput(action);
    });
}

setupMobileButton("btn-up", "up");
setupMobileButton("btn-down", "down");
setupMobileButton("btn-left", "left");
setupMobileButton("btn-right", "right");


function updateStringInfo() {
    infoTitle.innerText = `Configuration : Mode Harmonique n=${currentHarmonic} | ${dimensions[currentDimIndex]}`;
    if (currentDimIndex === 2 && currentHarmonic === 3) {
        infoText.innerText = "La corde résonne parfaitement avec les fluctuations gravitationnelles de la Théorie M !";
    } else if (currentDimIndex === 0) {
        infoText.innerText = "En 4D, la corde est écrasée et ressemble à une particule point classique. Montez en dimension !";
    } else {
        infoText.innerText = "La corde vibre dans les dimensions supérieures cachées (repliées en espaces de Calabi-Yau).";
    }
}

function spawnTarget() {
    const template = targetsData[Math.floor(Math.random() * targetsData.length)];
    activeTargets.push({
        ...template,
        x: canvas.width + 20,
        y: canvas.height / 2,
        speed: 2 + Math.random() * 2
    });
}

function resetGame() {
    score = 0;
    stability = 100;
    gameOver = false;
    activeTargets = [];
    currentHarmonic = 1;
    currentDimIndex = 0;
    scoreDisplay.innerText = score;
    stabilityDisplay.innerText = "100%";
    stabilityDisplay.style.color = "#00ffcc";
    resetBtn.style.display = "none";
    updateStringInfo();
    gameLoop();
}

// --- BOUCLE DE JEU ---
function gameLoop() {
    if (gameOver) return;

    gameTime += 0.05;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Effet visuel Brane (11D)
    if (currentDimIndex === 2) {
        ctx.fillStyle = "rgba(0, 255, 200, 0.03)";
        ctx.fillRect(0, 50, canvas.width, canvas.height - 100);
        ctx.strokeStyle = "rgba(0, 255, 200, 0.1)";
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 50, canvas.width - 20, canvas.height - 100);
    }

    const stringY = canvas.height / 2;
    ctx.beginPath();
    ctx.lineWidth = currentDimIndex === 0 ? 5 : 3; 
    
    if (currentDimIndex === 0) ctx.strokeStyle = "#94a3b8";
    else if (currentDimIndex === 1) ctx.strokeStyle = "#ff007f";
    else ctx.strokeStyle = "#a855f7";

    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.strokeStyle;
    
    for (let x = 150; x <= 350; x++) {
        let amp = currentDimIndex === 0 ? 2 : 40; 
        let wave = Math.sin((x - 150) * currentHarmonic * Math.PI / 200) * Math.sin(gameTime * 3);
        
        if (x === 150) ctx.moveTo(x, stringY + wave * amp);
        else ctx.lineTo(x, stringY + wave * amp);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; 

    if (currentDimIndex < 2) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(150, stringY, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(350, stringY, 5, 0, Math.PI*2); ctx.fill();
    }

    spawnTimer++;
    if (spawnTimer > 90) {
        spawnTarget();
        spawnTimer = 0;
    }

    for (let i = activeTargets.length - 1; i >= 0; i--) {
        let t = activeTargets[i];
        t.x -= t.speed;

        ctx.beginPath();
        ctx.fillStyle = t.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = t.color;
        
        if (t.name === "Graviton") {
            ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
            ctx.strokeStyle = t.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.arc(t.x, t.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${t.name} (${dimensions[t.dimIndex].split(' ')[0]})`, t.x, t.y - 18);

        // Zone de collision au milieu de la corde
        if (t.x <= 250 && t.x >= 240) {
            if (currentHarmonic === t.harmonic && currentDimIndex === t.dimIndex) {
                score += 150;
                scoreDisplay.innerText = score;
                infoTitle.innerText = `⚡ HARMONIE : ${t.name} stabilisé !`;
                infoText.innerText = t.desc;
                activeTargets.splice(i, 1);
            }
        }

        // Particule manquée
        if (t.x < 100) {
            stability -= 20;
            if (stability <= 0) {
                stability = 0;
                gameOver = true;
                resetBtn.style.display = "block";
                infoTitle.innerText = "🚨 EFFONDREMENT DIMENSIONNEL !";
                infoText.innerText = "La texture de l'espace-temps s'est déchirée. Cliquez sur Réinitialiser pour stabiliser à nouveau la super-membrane.";
            }
            stabilityDisplay.innerText = stability + "%";
            if (stability < 40) stabilityDisplay.style.color = "#ff3366";
            activeTargets.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

updateStringInfo();
gameLoop();