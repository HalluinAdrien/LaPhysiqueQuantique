const canvas = document.getElementById("standardModelCanvas");
const ctx = canvas.getContext("2d");

// Liaisons DOM UI
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const infoTitle = document.getElementById("infoTitle");
const infoText = document.getElementById("infoText");

// Système de score et état
let score = 0;
let lives = 3;
let gameOver = false;
let currentSpeed = 1.8;

// Définition des 3 Cuves (Colonnes de réception en bas)
const sectors = [
    { id: "quark", name: "QUARKS", xStart: 0, xEnd: 266, color: "#ff7675" },
    { id: "lepton", name: "LEPTONS", xStart: 266, xEnd: 533, color: "#74b9ff" },
    { id: "boson", name: "BOSONS", xStart: 533, xEnd: 800, color: "#a29bfe" }
];

// Base de données scientifiques du Modèle Standard
const particleDatabase = [
    { symbol: "u", name: "Quark Up", type: "quark", color: "#ff7675", desc: "Charge +2/3. C'est l'un des composants principaux des protons et des neutrons." },
    { symbol: "d", name: "Quark Down", type: "quark", color: "#d63031", desc: "Charge -1/3. S'associe aux quarks Up pour former le noyau des atomes stables." },
    { symbol: "t", name: "Quark Top", type: "quark", color: "#b2bec3", desc: "Le quark le plus massif découvert. Il se désintègre presque instantanément." },
    { symbol: "e⁻", name: "Électron", type: "lepton", color: "#74b9ff", desc: "Charge -1. Gravite autour des noyaux atomiques et génère le courant électrique." },
    { symbol: "νₑ", name: "Neutrino Électron", type: "lepton", color: "#0984e3", desc: "Masse quasi-nulle, aucune charge. Des milliards traversent votre corps chaque seconde." },
    { symbol: "μ⁻", name: "Muon", type: "lepton", color: "#55efc4", desc: "Une version lourde de l'électron (200 fois plus massif), créée lors des chocs cosmiques." },
    { symbol: "γ", name: "Photon", type: "boson", color: "#ffeaa7", desc: "Masse nulle. Particule élémentaire de la lumière et vecteur de la force électromagnétique." },
    { symbol: "g", name: "Gluon", type: "boson", color: "#fdcb6e", desc: "Particule de liaison. Transmet l'interaction forte qui 'colle' les quarks entre eux." },
    { symbol: "Z⁰", name: "Boson Z", type: "boson", color: "#a29bfe", desc: "Particule lourde responsable de l'interaction faible, à l'origine de la radioactivité." },
    { symbol: "H", name: "Boson de Higgs", type: "boson", color: "#fd79a8", desc: "Le chaînon manquant détecté au CERN en 2012. Il confère leur masse aux autres particules." }
];

// Objet de la particule en chute active
let activeParticle = null;

// Initialisation des contrôles clavier
let keys = { ArrowLeft: false, ArrowRight: false };
window.addEventListener("keydown", (e) => { if (e.key in keys) keys[e.key] = true; });
window.addEventListener("keyup", (e) => { if (e.key in keys) keys[e.key] = false; });

// Générer une particule aléatoire depuis la base de données
function spawnParticle() {
    const randomTemplate = particleDatabase[Math.floor(Math.random() * particleDatabase.length)];
    
    activeParticle = {
        ...randomTemplate,
        x: canvas.width / 2, // Pop au milieu horizontal
        y: 30,               // Un peu sous le plafond
        radius: 22,
        lateralSpeed: 5
    };
}

// Mise à jour de la jauge de vies textuelle
function updateLivesUI() {
    livesDisplay.innerText = "♥".repeat(lives);
    if (lives === 0) {
        gameOver = true;
        infoTitle.innerText = "🚨 ACCÉLÉRATEUR EN CORRUPTION !";
        infoTitle.style.color = "#ff3366";
        infoText.innerText = "Trop d'erreurs de tri ont déstabilisé le confinement magnétique. Score final : " + score + " points. Rechargez la page pour redémarrer.";
    }
}

// --- BOUCLE LOGIQUE ---
function gameLoop() {
    if (gameOver) return;

    // Effacement de la frame précédente
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. DESSINER LES CUVES DE CONFINEMENT (Arrière-plan bas)
    sectors.forEach(sec => {
        // Fond de la cuve semi-transparent
        ctx.fillStyle = sec.color + "15"; 
        ctx.fillRect(sec.xStart, canvas.height - 80, sec.xEnd - sec.xStart, 80);

        // Ligne de démarcation supérieure de la cuve
        ctx.strokeStyle = sec.color + "77";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sec.xStart, canvas.height - 80);
        ctx.lineTo(sec.xEnd, canvas.height - 80);
        ctx.stroke();

        // Séparateurs verticaux entre les cuves
        ctx.beginPath();
        ctx.moveTo(sec.xEnd, canvas.height - 80);
        ctx.lineTo(sec.xEnd, canvas.height);
        ctx.stroke();

        // Texte d'identification de la cuve
        ctx.fillStyle = sec.color;
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(sec.name, (sec.xStart + sec.xEnd) / 2, canvas.height - 35);
    });

    // 2. GESTION DE LA PARTICULE ACTIVE
    if (activeParticle) {
        // Déplacement latéral par le joueur
        if (keys.ArrowLeft) activeParticle.x -= activeParticle.lateralSpeed;
        if (keys.ArrowRight) activeParticle.x += activeParticle.lateralSpeed;

        // Limites des parois gauches et droites du collisionneur
        if (activeParticle.x - activeParticle.radius < 0) activeParticle.x = activeParticle.radius;
        if (activeParticle.x + activeParticle.radius > canvas.width) activeParticle.x = canvas.width - activeParticle.radius;

        // Gravité constante descendante
        activeParticle.y += currentSpeed;

        // ---- TEST DE COLLISION (Arrivée en bas dans les cuves) ----
        if (activeParticle.y + activeParticle.radius >= canvas.height - 80) {
            // Déterminer dans quel secteur X la particule est tombée
            let landedSector = sectors.find(sec => activeParticle.x >= sec.xStart && activeParticle.x <= sec.xEnd);

            if (landedSector && landedSector.id === activeParticle.type) {
                // BON SÉPARATEUR : Gain de points
                score += 100;
                scoreDisplay.innerText = score;
                
                // Augmentation subtile de la vitesse pour le défi
                currentSpeed += 0.08;

                // Affichage pédagogique
                infoTitle.innerText = `✅ SUCCÈS : ${activeParticle.name} capturé !`;
                infoTitle.style.color = "#00ffaa";
                infoText.innerText = activeParticle.desc;
            } else {
                // MAUVAIS SÉPARATEUR : Perte d'intégrité
                lives--;
                updateLivesUI();
                
                infoTitle.innerText = `❌ ERREUR DE TRI : Confinement brisé !`;
                infoTitle.style.color = "#ff3366";
                let correctSectorName = sectors.find(s => s.id === activeParticle.type).name;
                infoText.innerText = `Le ${activeParticle.name} n'est pas un membre des ${landedSector ? landedSector.name : "Inconnus"}. C'est un composant de la famille des ${correctSectorName}.`;
            }

            // Génération de la particule suivante
            if (!gameOver) spawnParticle();
        }

        // 3. DESSIN DE LA PARTICULE ACTIVE (Effets visuels quantiques)
        if (!gameOver) {
            ctx.beginPath();
            ctx.fillStyle = activeParticle.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = activeParticle.color;
            ctx.arc(activeParticle.x, activeParticle.y, activeParticle.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset ombre pour les textes

            // Dessin du symbole scientifique au centre du cercle
            ctx.fillStyle = "#05070b";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(activeParticle.symbol, activeParticle.x, activeParticle.y);

            // Petit label texte flottant au-dessus pour guider l'élève
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = "12px Arial";
            ctx.fillText(activeParticle.name, activeParticle.x, activeParticle.y - activeParticle.radius - 8);
        }
    }

    requestAnimationFrame(gameLoop);
}

// Lancement de la première particule et démarrage
spawnParticle();
gameLoop();
