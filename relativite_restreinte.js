const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");

// États du jeu
let ship = { x: 80, y: 200, radius: 15, speed: 6 };
let speedPercent = 10.0; // commence à 10% de c
let maxSpeed = 99.9;
let gamma = 1.0;
let integrity = 100;
let earthTime = 0;
let shipTime = 0;
let gameOver = false;
let gameWon = false;

let obstacles = [];
let crystals = [];
let stars = [];

// Initialisation des étoiles de fond
for(let i=0; i<60; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseSpeed: Math.random() * 2 + 1,
        size: Math.random() * 2
    });
}

// Événements Clavier
let keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// Événements tactiles mobiles
const btnUp = document.getElementById("btn-up");
const btnDown = document.getElementById("btn-down");

let moveUp = false;
let moveDown = false;
btnUp.addEventListener("touchstart", (e) => { e.preventDefault(); moveUp = true; });
btnUp.addEventListener("touchend", () => moveUp = false);
btnDown.addEventListener("touchstart", (e) => { e.preventDefault(); moveDown = true; });
btnDown.addEventListener("touchend", () => moveDown = false);

function calculateRelativity() {
    let beta = speedPercent / 100;
    gamma = 1 / Math.sqrt(1 - beta * beta);
    
    // Mise à jour du HUD physique
    document.getElementById("txt-speed").innerText = speedPercent.toFixed(1) + "% c";
    document.getElementById("txt-gamma").innerText = gamma.toFixed(2);
    document.getElementById("txt-earth-time").innerText = Math.floor(earthTime) + "s";
    document.getElementById("txt-ship-time").innerText = Math.floor(shipTime) + "s";
    
    let integrityTxt = document.getElementById("txt-integrity");
    integrityTxt.innerText = integrity + "%";
    if(integrity < 40) integrityTxt.style.color = "#f43f5e";
    else integrityTxt.style.color = "#22c55e";
}

function spawnEntities() {
    if (gameOver || gameWon) return;
    
    // Fréquence d'apparition des obstacles
    if (Math.random() < 0.03) {
        obstacles.push({
            x: canvas.width + 50,
            y: Math.random() * (canvas.height - 40) + 20,
            width: 30,
            height: 30,
            speed: Math.random() * 3 + 4
        });
    }

    // Fréquence d'apparition des cristaux d'énergie
    if (Math.random() < 0.02) {
        crystals.push({
            x: canvas.width + 50,
            y: Math.random() * (canvas.height - 40) + 20,
            radius: 8,
            speed: 5
        });
    }
}

function update() {
    if (gameOver || gameWon) return;

    // Incrémentation du temps (Dilatation Temporelle Relativiste)
    shipTime += 1 / 60; 
    earthTime += (1 / 60) * gamma; 

    // Déplacement du vaisseau
    if (keys["ArrowUp"] || keys["z"] || keys["Z"] || moveUp) {
        ship.y -= ship.speed;
    }
    if (keys["ArrowDown"] || keys["s"] || keys["S"] || moveDown) {
        ship.y += ship.speed;
    }

    // Limites de la zone de vol
    if (ship.y - ship.radius < 0) ship.y = ship.radius;
    if (ship.y + ship.radius > canvas.height) ship.y = canvas.height - ship.radius;

    // Fond étoilé s'accélère avec Gamma
    stars.forEach(star => {
        star.x -= star.baseSpeed * (1 + (gamma * 0.1));
        if (star.x < 0) {
            star.x = canvas.width;
            star.y = Math.random() * canvas.height;
        }
    });

    // Gestion des Obstacles (Contraction des longueurs)
    obstacles.forEach((obs, index) => {
        obs.x -= obs.speed * (1 + (gamma * 0.05));

        // Calcul de la taille de l'obstacle contracté
        let contractedWidth = obs.width / gamma;

        // Détection de collision
        if (ship.x + ship.radius > obs.x && ship.x - ship.radius < obs.x + contractedWidth &&
            ship.y + ship.radius > obs.y && ship.y - ship.radius < obs.y + obs.height) {
            
            integrity -= 25;
            speedPercent = Math.max(10.0, speedPercent - 15);
            obstacles.splice(index, 1);
            if (integrity <= 0) {
                integrity = 0;
                gameOver = true;
                document.getElementById("resetBtn").style.display = "block";
            }
        }

        if (obs.x < -50) obstacles.splice(index, 1);
    });

    // Gestion des Cristaux de Tachyons
    crystals.forEach((cry, index) => {
        cry.x -= cry.speed;

        let dist = Math.hypot(ship.x - cry.x, ship.y - cry.y);
        if (dist < ship.radius + cry.radius) {
            speedPercent += 4.5;
            if (speedPercent >= maxSpeed) {
                speedPercent = maxSpeed;
                gameWon = true;
                document.getElementById("resetBtn").style.display = "block";
            }
            crystals.splice(index, 1);
        }

        if (cry.x < -20) crystals.splice(index, 1);
    });

    calculateRelativity();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Dessiner les étoiles (Effet d'étirement relativiste)
    ctx.fillStyle = "#ffffff";
    stars.forEach(star => {
        let currentLength = star.size + (gamma * 1.5);
        ctx.fillRect(star.x, star.y, currentLength, star.size);
    });

    // 2. Dessiner le Vaisseau
    ctx.save();
    ctx.translate(ship.x, ship.y);
    
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 + (gamma*0.05)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ship.radius + 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -12);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = speedPercent > 70 ? "#f43f5e" : "#38bdf8";
    ctx.fillRect(-12, -4, 4, 8);
    ctx.restore();

    // 3. Dessiner les obstacles (Contractés horizontalement)
    obstacles.forEach(obs => {
        let contractedWidth = obs.width / gamma;
        ctx.fillStyle = "rgba(244, 63, 94, 0.85)";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#f43f5e";
        ctx.fillRect(obs.x, obs.y, contractedWidth, obs.height);
        ctx.shadowBlur = 0;
    });

    // 4. Dessiner les Cristaux
    crystals.forEach(cry => {
        ctx.fillStyle = "#22d3ee";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#22d3ee";
        ctx.beginPath();
        ctx.arc(cry.x, cry.y, cry.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Écrans de Fin de partie
    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 28px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText("Vaisseau Désintégré !", canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = "16px Segoe UI";
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText("La barrière d'espace-temps était trop dense.", canvas.width / 2, canvas.height / 2 + 20);
    } else if (gameWon) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 30px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText("Horizon Relativiste Atteint !", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "16px Segoe UI";
        ctx.fillStyle = "#a7f3d0";
        ctx.fillText(`Tu as voyagé à ${speedPercent}% de c !`, canvas.width / 2, canvas.height / 2 + 15);
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText(`Pendant tes quelques secondes de vol, des siècles ont passé sur Terre.`, canvas.width / 2, canvas.height / 2 + 45);
    }
}

function resetGame() {
    speedPercent = 10.0;
    gamma = 1.0;
    integrity = 100;
    earthTime = 0;
    shipTime = 0;
    gameOver = false;
    gameWon = false;
    obstacles = [];
    crystals = [];
    document.getElementById("resetBtn").style.display = "none";
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Lancement des boucles du jeu
setInterval(spawnEntities, 100);
loop();