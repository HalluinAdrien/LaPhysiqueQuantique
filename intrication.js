const canvas = document.getElementById("puzzleCanvas");
const ctx = canvas.getContext("2d");
const obsStatus = document.getElementById("obsStatus");

// --- PHYSIQUE ADOUCIE ET PLUS ACCESSIBLE ---
const gravity = 0.45;     // Légèrement diminuée (chute moins lourde)
const friction = 0.82;
const jumpForce = 10.5;   // Augmentée (les particules sautent un peu plus haut)
const moveSpeed = 4.5;    // Vitesse augmentée pour une meilleure réactivité

let isObserved = false;

class Particle {
    constructor(x, y, color) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.size = 22; // Taille légèrement augmentée pour mieux la voir
        this.vx = 0;
        this.vy = 0;
        this.color = color;
        this.grounded = false;
    }
    
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.vx = 0;
        this.vy = 0;
    }
}

// Positions de départ confortables
let partA = new Particle(60, 320, "#33ffcc");
let partB = new Particle(720, 320, "#ff33cc");

// --- LEVEL DESIGN RECALIBRÉ (Plus large, moins de vide piégeux) ---
const platforms = [
    // Le Sol principal
    { x: 0, y: 380, w: 800, h: 20, superposed: false },
    
    // Mur central de séparation (légèrement rabaissé pour laisser passer les sauts du haut)
    { x: 392, y: 160, w: 16, h: 220, superposed: false },

    // Plateformes de départ stables (Plus larges : 180px au lieu de 150px)
    { x: 0, y: 260, w: 180, h: 20, superposed: false },
    { x: 620, y: 260, w: 180, h: 20, superposed: false },

    // Plateformes Quantiques Basses (Plus larges et rapprochées du centre)
    { x: 170, y: 310, w: 120, h: 15, superposed: true },
    { x: 510, y: 310, w: 120, h: 15, superposed: true },
    
    // Plateformes Quantiques Hautes (Idéalement placées sous les portails)
    { x: 230, y: 170, w: 130, h: 15, superposed: true },
    { x: 440, y: 170, w: 130, h: 15, superposed: true }
];

// --- PORTAILS PLUS GRANDS (w: 60, h: 60 au lieu de 40x50) ---
// Ils sont maintenant très faciles à cibler au sommet des dernières plateformes
const goals = {
    A: { x: 265, y: 110, w: 60, h: 60, color: "rgba(51, 255, 204, 0.55)" },
    B: { x: 475, y: 110, w: 60, h: 60, color: "rgba(255, 51, 204, 0.55)" }
};

// Écouteurs clavier
let keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        isObserved = true;
        obsStatus.innerText = "Réalité Figée (Observé)";
        obsStatus.classList.add("active");
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        isObserved = false;
        obsStatus.innerText = "Ondes Superposées (Non Observé)";
        obsStatus.classList.remove("active");
    }
});

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
           rect1.x + rect1.size > rect2.x &&
           rect1.y < rect2.y + rect2.h &&
           rect1.y + rect1.size > rect2.y;
}

function applyPhysics(p) {
    p.vy += gravity;
    p.x += p.vx;
    
    // Collisions horizontales
    platforms.forEach(plat => {
        if (plat.superposed && !isObserved) return; 
        if (checkCollision(p, plat)) {
            if (p.vx > 0) p.x = plat.x - p.size;
            else if (p.vx < 0) p.x = plat.x + plat.w;
            p.vx = 0;
        }
    });

    p.y += p.vy;
    p.grounded = false;

    // Collisions verticales
    platforms.forEach(plat => {
        if (plat.superposed && !isObserved) return;
        if (checkCollision(p, plat)) {
            if (p.vy > 0) {
                p.y = plat.y - p.size;
                p.vy = 0;
                p.grounded = true;
            } else if (p.vy < 0) {
                p.y = plat.y + plat.h;
                p.vy = 0;
            }
        }
    });

    // Maintien dans l'écran
    if (p.x < 0) p.x = 0;
    if (p.x + p.size > canvas.width) p.x = canvas.width - p.size;
    
    // Reset si chute accidentelle
    if (p.y > canvas.height) {
        partA.reset();
        partB.reset();
    }
}

// --- BOUCLE DE RENDU ET LOGIQUE ---
function gameLoop() {
    // Application de l'Intrication (Miroir horizontal)
    if (keys["ArrowRight"]) {
        partA.vx = moveSpeed;
        partB.vx = -moveSpeed;
    } else if (keys["ArrowLeft"]) {
        partA.vx = -moveSpeed;
        partB.vx = moveSpeed;
    } else {
        partA.vx *= friction;
        partB.vx *= friction;
    }

    // Saut simultané
    if (keys["ArrowUp"] && partA.grounded && partB.grounded) {
        partA.vy = -jumpForce;
        partB.vy = -jumpForce;
    }

    applyPhysics(partA);
    applyPhysics(partB);

    // Détection élargie de victoire
    let winA = (partA.x + partA.size/2 > goals.A.x && partA.x + partA.size/2 < goals.A.x + goals.A.w && partA.y + partA.size/2 > goals.A.y && partA.y + partA.size/2 < goals.A.y + goals.A.h);
    let winB = (partB.x + partB.size/2 > goals.B.x && partB.x + partB.size/2 < goals.B.x + goals.B.w && partB.y + partB.size/2 > goals.B.y && partB.y + partB.size/2 < goals.B.y + goals.B.h);
    
    if (winA && winB) {
        alert("Félicitations ! Cohérence quantique préservée, niveau réussi !");
        partA.reset();
        partB.reset();
    }

    // --- DESSIN DES GRAPHISMES ---
    ctx.fillStyle = isObserved ? "#121820" : "#0d1117"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Portails de fin (Effet de halo lumineux)
    ctx.shadowBlur = 10;
    ctx.fillStyle = goals.A.color;
    ctx.shadowColor = "#33ffcc";
    ctx.fillRect(goals.A.x, goals.A.y, goals.A.w, goals.A.h);
    
    ctx.fillStyle = goals.B.color;
    ctx.shadowColor = "#ff33cc";
    ctx.fillRect(goals.B.x, goals.B.y, goals.B.w, goals.B.h);
    ctx.shadowBlur = 0;

    // Dessin des plateformes
    platforms.forEach(plat => {
        if (plat.superposed) {
            if (isObserved) {
                ctx.fillStyle = "#b55fe6";
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            } else {
                ctx.strokeStyle = "rgba(181, 95, 230, 0.4)";
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
                ctx.setLineDash([]);
            }
        } else {
            ctx.fillStyle = "#4f5d73";
            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        }
    });

    // Dessin des Avatars
    ctx.shadowBlur = 12;
    ctx.fillStyle = partA.color;
    ctx.shadowColor = partA.color;
    ctx.fillRect(partA.x, partA.y, partA.size, partA.size);
    
    ctx.fillStyle = partB.color;
    ctx.shadowColor = partB.color;
    ctx.fillRect(partB.x, partB.y, partB.size, partB.size);
    ctx.shadowBlur = 0;

    requestAnimationFrame(gameLoop);
}

gameLoop();