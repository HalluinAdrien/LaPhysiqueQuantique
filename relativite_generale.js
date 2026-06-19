const canvas = document.getElementById("gravityCanvas");
const ctx = canvas.getContext("2d");

// Configuration du Trou Noir central (Singularité)
const blackHole = {
    x: 400,
    y: 225,
    mass: 1800,       // Puissance d'aspiration gravitationnelle
    rs: 45,          // Rayon de Schwarzschild (Horizon des événements - Ligne Rouge)
    ergosphere: 90   // Zone d'influence temporelle majeure
};

// État du vaisseau du joueur
let ship = {
    x: 150,
    y: 225,
    vx: 0,
    vy: -2.5,        // Vitesse initiale pour amorcer une orbite stable
    radius: 8,
    thrust: 0.18
};

// Variables système
let score = 0;
let earthTime = 0;
let shipTime = 0;
let gameOver = false;
let gameWon = false;
let currentGravityFactor = 1.0;

let dataOrbs = [];

// Événements d'entrée clavier
let keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// Événements tactiles mobiles
let mobileThrust = { up: false, down: false, left: false, right: false };
setupMobileButton("btn-up", "up");
setupMobileButton("btn-down", "down");
setupMobileButton("btn-left", "left");
setupMobileButton("btn-right", "right");

function setupMobileButton(id, direction) {
    const btn = document.getElementById(id);
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); mobileThrust[direction] = true; });
    btn.addEventListener("touchend", () => mobileThrust[direction] = false);
}

// Générer une capsule de données scientifiques à récolter
function spawnDataOrb() {
    if (dataOrbs.length >= 3 || gameOver || gameWon) return;
    
    // Génère une position aléatoire autour du trou noir mais en dehors du rayon critique
    let angle = Math.random() * Math.PI * 2;
    let distance = Math.random() * 150 + (blackHole.rs + 40);
    
    dataOrbs.push({
        x: blackHole.x + Math.cos(angle) * distance,
        y: blackHole.y + Math.sin(angle) * distance,
        radius: 6
    });
}

// Fonction mathématique pour calculer la distorsion de la grille d'espace-temps
function getDistortedPoint(gridX, gridY) {
    let dx = gridX - blackHole.x;
    let dy = gridY - blackHole.y;
    let dist = Math.hypot(dx, dy);

    if (dist < blackHole.rs) {
        // Au centre de la singularité, la structure de l'espace-temps s'effondre
        return { x: blackHole.x, y: blackHole.y };
    }

    // Effet de lentille/aspiration : contracte les coordonnées vers le centre
    // Plus on est près, plus le déplacement vers la singularité est grand
    let strength = (blackHole.mass * 0.85) / dist;
    let pull = Math.min(dist, strength); 
    
    return {
        x: gridX - (dx / dist) * pull,
        y: gridY - (dy / dist) * pull
    };
}

function update() {
    if (gameOver || gameWon) return;

    // 1. Calcul de la distance au centre du Trou Noir
    let dx = blackHole.x - ship.x;
    let dy = blackHole.y - ship.y;
    let dist = Math.hypot(dx, dy);

    // CRITÈRE DE DÉFAITE : Franchissement de l'Horizon des Événements
    if (dist <= blackHole.rs) {
        gameOver = true;
        document.getElementById("resetBtn").style.display = "block";
        return;
    }

    // 2. Équation de la Gravité Newtonienne modifiée (Simulation de la courbure)
    // Force = G * M / r²
    let force = blackHole.mass / (dist * dist);
    currentGravityFactor = force * 25; // Pour affichage HUD
    
    // Application de l'accélération gravitationnelle vers le centre
    ship.vx += (dx / dist) * force;
    ship.vy += (dy / dist) * force;

    // 3. Gestion des entrées joueurs (Propulsion de la sonde)
    if (keys["arrowup"] || keys["z"] || mobileThrust.up) ship.vy -= ship.thrust;
    if (keys["arrowdown"] || keys["s"] || mobileThrust.down) ship.vy += ship.thrust;
    if (keys["arrowleft"] || keys["q"] || mobileThrust.left) ship.vx -= ship.thrust;
    if (keys["arrowright"] || keys["d"] || mobileThrust.right) ship.vx += ship.thrust;

    // Mise à jour de la position
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Limites de sécurité du Canvas
    if(ship.x < 0 || ship.x > canvas.width || ship.y < 0 || ship.y > canvas.height) {
        gameOver = true;
        document.getElementById("resetBtn").style.display = "block";
    }

    // 4. EFFET RELATIVISTE : Dilatation Temporelle Gravitationnelle (Formule d'Einstein)
    let timeDilationFactor = Math.sqrt(1 - (blackHole.rs / dist));
    
    shipTime += 1 / 60; // Le temps de la sonde s'écoule de manière fluide pour le pilote
    earthTime += (1 / 60) / timeDilationFactor; // Le temps terrestre s'accélère vu de la sonde !

    // 5. Gestion des collisions avec les capsules de données
    dataOrbs.forEach((orb, index) => {
        let dOrb = Math.hypot(ship.x - orb.x, ship.y - orb.y);
        if (dOrb < ship.radius + orb.radius) {
            dataOrbs.splice(index, 1);
            score++;
            if (score >= 10) {
                gameWon = true;
                document.getElementById("resetBtn").style.display = "block";
            }
        }
    });

    // Mise à jour du HUD
    document.getElementById("txt-score").innerText = score + " / 10";
    document.getElementById("txt-gravity").innerText = currentGravityFactor.toFixed(1) + " g";
    document.getElementById("txt-earth").innerText = Math.floor(earthTime) + "s";
    document.getElementById("txt-ship").innerText = Math.floor(shipTime) + "s";
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🌌 DESSIN DE LA GRILLE D'ESPACE-TEMPS WARPÉE
    ctx.strokeStyle = "rgba(186, 104, 200, 0.12)";
    ctx.lineWidth = 1;
    let gridSize = 30;

    // Lignes verticales courbées
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        for (let y = 0; y <= canvas.height; y += 10) {
            let p = getDistortedPoint(x, y);
            if (y === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    // Lignes horizontales courbées
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 10) {
            let p = getDistortedPoint(x, y);
            if (x === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    // 🔴 ERGOSPHÈRE (Zone d'altération temporelle)
    ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(blackHole.x, blackHole.y, blackHole.ergosphere, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // 🔴 HORIZON DES ÉVÉNEMENTS (Limite critique de non-retour)
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#f43f5e";
    ctx.beginPath();
    ctx.arc(blackHole.x, blackHole.y, blackHole.rs, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset

    // 🕳️ LE TROU NOIR (La singularité centrale)
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(blackHole.x, blackHole.y, blackHole.rs - 2, 0, Math.PI * 2);
    ctx.fill();

    // 🚀 DESSIN DE LA SONDE SPATIALE
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#38bdf8";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Vector de direction (petite ligne montrant où va le vaisseau)
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.vx * 4, ship.y + ship.vy * 4);
    ctx.stroke();

    // 💎 DESSIN DES CAPSULES DE DONNÉES QUANTIQUES
    dataOrbs.forEach(orb => {
        ctx.fillStyle = "#00ffaa";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ffaa";
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // ÉCRANS DE FIN
    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 26px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText("Effondrement Gravitationnel !", canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = "15px Segoe UI";
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText("La sonde a franchi le Rayon de Schwarzschild. Spaghettification terminée.", canvas.width / 2, canvas.height / 2 + 20);
    } else if (gameWon) {
        ctx.fillStyle = "rgba(11, 14, 23, 0.9)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00ffaa";
        ctx.font = "bold 28px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText("Mission Scientifique Réussie !", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "15px Segoe UI";
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText(`Données extraites avec succès après ${Math.floor(shipTime)}s de vol à bord.`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillStyle = "#eab308";
        ctx.fillText(`Pendant ce temps, plus de ${Math.floor(earthTime)} secondes se sont écoulées sur Terre !`, canvas.width / 2, canvas.height / 2 + 35);
    }
}

function resetGame() {
    ship.x = 150;
    ship.y = 225;
    ship.vx = 0;
    ship.vy = -2.5;
    score = 0;
    earthTime = 0;
    shipTime = 0;
    gameOver = false;
    gameWon = false;
    dataOrbs = [];
    document.getElementById("resetBtn").style.display = "none";
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Génération régulière des données à ramasser
setInterval(spawnDataOrb, 2000);

// Démarrage
loop();