const canvas = document.getElementById("photonCanvas");
const ctx = canvas.getContext("2d");

// Éléments de l'interface
const scoreDisplay = document.getElementById("scoreDisplay");
const orbitDisplay = document.getElementById("orbitDisplay");
const targetEnergyDisplay = document.getElementById("targetEnergy");

// Variables de jeu
let score = 0;
let gameOver = false;

// Le Noyau Atomique
const nucleus = { x: canvas.width / 2, y: canvas.height / 2, radius: 20 };

// Les Orbites (n=1, n=2, n=3, n=4)
const orbits = [80, 140, 200, 260];

// Dictionnaire des photons possibles (Énergie et Couleur)
const photonTypes = [
    { energy: 10, color: "#ff3333" }, // Rouge
    { energy: 15, color: "#33ff33" }, // Vert
    { energy: 20, color: "#3333ff" }, // Bleu
    { energy: 25, color: "#cc33ff" }  // Violet
];

// L'électron contrôlé par le joueur
let electron = {
    orbitIndex: 0, // Commence sur l'orbite la plus proche (n=1)
    angle: Math.PI / 2,
    radius: 10,
    speed: 0.08 // Vitesse de rotation
};

// Tableau contenant les photons qui tombent
let fallingPhotons = [];
let spawnTimer = 0;

// Énergie requise pour monter à l'orbite suivante
function getRequiredEnergy() {
    // Si on est à la dernière orbite, on demande la plus haute énergie pour faire une "ionisation" (gros bonus)
    if (electron.orbitIndex >= orbits.length - 1) return 25; 
    
    // Sinon, on demande une énergie spécifique selon l'orbite actuelle
    if (electron.orbitIndex === 0) return 10;
    if (electron.orbitIndex === 1) return 15;
    if (electron.orbitIndex === 2) return 20;
    return 10;
}

function updateHUD() {
    scoreDisplay.innerText = score;
    orbitDisplay.innerText = electron.orbitIndex + 1;
    let reqEnergy = getRequiredEnergy();
    
    // Trouver la couleur correspondante pour l'afficher joliment
    let color = photonTypes.find(p => p.energy === reqEnergy).color;
    targetEnergyDisplay.innerText = `${reqEnergy} eV`;
    targetEnergyDisplay.style.color = color;
    targetEnergyDisplay.style.textShadow = `0 0 10px ${color}`;
}

// Contrôles du clavier
let keys = { ArrowLeft: false, ArrowRight: false };

window.addEventListener("keydown", (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// Générer un nouveau photon
function spawnPhoton() {
    // Choisir un type de photon au hasard
    let type = photonTypes[Math.floor(Math.random() * photonTypes.length)];
    
    // Apparition aléatoire en haut de l'écran
    fallingPhotons.push({
        x: Math.random() * canvas.width,
        y: -20,
        radius: 8,
        energy: type.energy,
        color: type.color,
        speed: 2 + Math.random() * 2 // Vitesse de chute aléatoire
    });
}

// --- BOUCLE PRINCIPALE ---
function gameLoop() {
    if (gameOver) return; // Stoppe le jeu si perdu

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Mettre à jour la position de l'électron (Commandes)
    if (keys.ArrowLeft) electron.angle -= electron.speed;
    if (keys.ArrowRight) electron.angle += electron.speed;

    // Calculer les coordonnées X et Y de l'électron sur son orbite (Trigonométrie)
    let currentOrbitRadius = orbits[electron.orbitIndex];
    let electronX = nucleus.x + Math.cos(electron.angle) * currentOrbitRadius;
    let electronY = nucleus.y + Math.sin(electron.angle) * currentOrbitRadius;

    // 2. Gestion des Photons
    spawnTimer++;
    if (spawnTimer > 60) { // Ajoute un photon environ toutes les secondes
        spawnPhoton();
        spawnTimer = 0;
    }

    for (let i = fallingPhotons.length - 1; i >= 0; i--) {
        let p = fallingPhotons[i];
        p.y += p.speed; // Fait tomber le photon

        // Dessiner le photon (comme une petite onde lumineuse)
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Afficher l'énergie sur le photon
        ctx.fillStyle = "#fff";
        ctx.font = "10px Arial";
        ctx.fillText(`${p.energy}`, p.x - 6, p.y - 12);

        // Détection de collision (Théorème de Pythagore pour calculer la distance)
        let dist = Math.hypot(electronX - p.x, electronY - p.y);
        
        if (dist < electron.radius + p.radius) {
            // COLLISION ! L'électron absorbe le photon
            let required = getRequiredEnergy();

            if (p.energy === required) {
                // BON CHOIX : Saut Quantique vers le haut !
                score += 100;
                electron.orbitIndex++;
                
                // Si on dépasse la dernière orbite, c'est l'ionisation ! On gagne plein de points et on recommence
                if (electron.orbitIndex >= orbits.length) {
                    score += 500;
                    electron.orbitIndex = 0; // Nouvel électron capturé
                }
            } else {
                // MAUVAIS CHOIX : Perte d'énergie, on descend d'une orbite
                score -= 50;
                electron.orbitIndex--;
                
                // Si on tombe en dessous de l'orbite 1, la partie est terminée
                if (electron.orbitIndex < 0) {
                    gameOver = true;
                    alert(`Expérience terminée ! \nLe noyau est devenu instable.\nScore final : ${score}`);
                    document.location.reload(); // Recharge la page
                }
            }
            
            updateHUD();
            fallingPhotons.splice(i, 1); // Supprime le photon absorbé
        } 
        // Supprimer le photon s'il sort de l'écran en bas
        else if (p.y > canvas.height + 20) {
            fallingPhotons.splice(i, 1);
        }
    }

    // 3. Dessiner l'Atome (Arrière-plan)
    
    // Le Noyau
    ctx.beginPath();
    let nucGradient = ctx.createRadialGradient(nucleus.x, nucleus.y, 2, nucleus.x, nucleus.y, nucleus.radius);
    nucGradient.addColorStop(0, "#fff");
    nucGradient.addColorStop(1, "#ff9900");
    ctx.fillStyle = nucGradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff9900";
    ctx.arc(nucleus.x, nucleus.y, nucleus.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Les Orbites (n=1, 2, 3...)
    ctx.lineWidth = 1;
    for (let i = 0; i < orbits.length; i++) {
        ctx.beginPath();
        // L'orbite actuelle brille plus fort
        ctx.strokeStyle = i === electron.orbitIndex ? "rgba(102, 252, 241, 0.8)" : "rgba(255, 255, 255, 0.1)";
        if (i === electron.orbitIndex) ctx.setLineDash([5, 5]); // Pointillés pour l'orbite active
        else ctx.setLineDash([]);
        
        ctx.arc(nucleus.x, nucleus.y, orbits[i], 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.setLineDash([]); // Reset

    // 4. Dessiner l'Électron
    ctx.beginPath();
    ctx.fillStyle = "#66fcf1";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#66fcf1";
    ctx.arc(electronX, electronY, electron.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Relancer la boucle
    requestAnimationFrame(gameLoop);
}

// Initialisation
updateHUD();
gameLoop();