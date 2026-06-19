const canvas = document.getElementById("tunnelCanvas");
const ctx = canvas.getContext("2d");

// Éléments de l'interface
const energySlider = document.getElementById("energySlider");
const energyLabel = document.getElementById("energyLabel");
const fireBtn = document.getElementById("fireBtn");
const probDisplay = document.getElementById("probDisplay");
const attemptsSc = document.getElementById("attemptsSc");
const tunnelSc = document.getElementById("tunnelSc");
const bounceSc = document.getElementById("bounceSc");

// Variables de scores
let stats = { attempts: 0, tunnels: 0, bounces: 0 };

// Configuration de la barrière de potentiel (le mur d'énergie)
const barrier = {
    x: 400,
    width: 40,
    height: canvas.height,
    v0: 100 // Hauteur du potentiel en eV
};

// Configuration de la particule
let particle = {
    x: 50,
    y: canvas.height / 2,
    radius: 12,
    vx: 0,
    baseSpeed: 4,
    state: "idle", // idle, moving, tunneling, bouncing, passed
    energy: parseInt(energySlider.value),
    wavePhase: 0
};

// Calcul en temps réel de la probabilité de passage (Loi de transmission)
function calculateProbability() {
    let E = particle.energy;
    let V0 = barrier.v0;
    let L = barrier.width;
    
    if (E >= V0) {
        return 100; // Physique classique : passe au-dessus de la barrière
    } else {
        // Formule de l'effet tunnel atténué
        let alpha = 0.025; 
        let kappa = alpha * Math.sqrt(V0 - E);
        let transmission = Math.exp(-2 * kappa * L);
        return Math.round(transmission * 100);
    }
}

function updateUI() {
    energyLabel.innerText = `Énergie de la particule (E) : ${particle.energy} eV`;
    let prob = calculateProbability();
    probDisplay.innerText = `${prob}%`;
    if (particle.energy >= barrier.v0) {
        probDisplay.innerText = "100% (Survol classique)";
        probDisplay.style.color = "#00ffcc";
    } else {
        probDisplay.style.color = "#ff007f";
    }
}

// Événement du slider
energySlider.addEventListener("input", (e) => {
    if (particle.state === "idle") {
        particle.energy = parseInt(e.target.value);
        updateUI();
    }
});

// Événement du bouton de tir
fireBtn.addEventListener("click", () => {
    if (particle.state === "idle") {
        particle.state = "moving";
        particle.vx = particle.baseSpeed * Math.sqrt(particle.energy / 50); // Vitesse dépend de l'énergie
        stats.attempts++;
        attemptsSc.innerText = stats.attempts;
    }
});

// Initialisation au démarrage
updateUI();

// --- BOUCLE DE JEU ---
function gameLoop() {
    // 1. Logique et Physique
    particle.wavePhase += 0.2; // Vitesse d'oscillation de la fonction d'onde

    if (particle.state === "moving") {
        particle.x += particle.vx;

        // Détecter l'impact avec le bord gauche de la barrière
        if (particle.x + particle.radius >= barrier.x && particle.x - particle.radius < barrier.x + barrier.width) {
            
            if (particle.energy >= barrier.v0) {
                // Cas Classique : Passage au-dessus
                particle.state = "passed";
            } else {
                // Cas Quantique : Jet de dés probabiliste
                let roll = Math.random() * 100;
                let successChance = calculateProbability();

                if (roll < successChance) {
                    particle.state = "tunneling"; // L'effet tunnel réussit !
                } else {
                    particle.state = "bouncing";  // Réflexion classique
                    particle.vx = -particle.vx;
                }
            }
        }
    } 
    else if (particle.state === "tunneling" || particle.state === "passed") {
        particle.x += particle.vx * 0.6; // Ralentissement visuel dans la barrière
        if (particle.x - particle.radius > barrier.x + barrier.width) {
            particle.state = "passed";
        }
    } 
    else if (particle.state === "bouncing") {
        particle.x += particle.vx;
        if (particle.x - particle.radius <= 0) {
            // Fin de l'animation de rebond
            stats.bounces++;
            bounceSc.innerText = stats.bounces;
            resetParticle();
        }
    }

    // Si la particule a réussi et traverse l'écran à droite
    if (particle.state === "passed" && particle.x - particle.radius > canvas.width) {
        if (particle.energy < barrier.v0) {
            stats.tunnels++;
            tunnelSc.innerText = stats.tunnels;
        }
        resetParticle();
    }

    // 2. Dessins (Graphismes)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessin de la barrière de potentiel (Mur d'énergie)
    let barGradient = ctx.createLinearGradient(barrier.x, 0, barrier.x + barrier.width, 0);
    barGradient.addColorStop(0, "rgba(255, 0, 80, 0.8)");
    barGradient.addColorStop(1, "rgba(255, 0, 80, 0.4)");
    ctx.fillStyle = barGradient;
    ctx.fillRect(barrier.x, 0, barrier.width, barrier.height);

    // Ligne repère du sommet d'énergie (V0 = 100eV)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - barrier.v0 * 2);
    ctx.lineTo(canvas.width, canvas.height - barrier.v0 * 2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset les pointillés

    // Dessin de la fonction d'onde (la sinusoïde de la particule)
    ctx.beginPath();
    ctx.strokeStyle = particle.state === "tunneling" ? "rgba(0, 255, 200, 0.3)" : "rgba(69, 243, 255, 0.4)";
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 2) {
        let amp = 0;
        
        // Avant la barrière : Onde normale
        if (i < barrier.x) {
            amp = 25;
        } 
        // Dans la barrière : Décroissance exponentielle si Effet Tunnel
        else if (i >= barrier.x && i <= barrier.x + barrier.width) {
            if (particle.energy < barrier.v0) {
                let distInside = i - barrier.x;
                amp = 25 * Math.exp(-0.04 * distInside); // Simulation visuelle de l'atténuation
            } else {
                amp = 25; // Pas d'atténuation au-dessus du mur
            }
        } 
        // Après la barrière : Onde transmise plus faible
        else {
            if (particle.energy < barrier.v0) {
                let totalDist = barrier.width;
                amp = 25 * Math.exp(-0.04 * totalDist);
            } else {
                amp = 25;
            }
        }

        // On ne dessine l'onde que si la particule est en train d'avancer
        let waveY = particle.y + Math.sin(i * 0.05 - particle.wavePhase) * amp;
        if (i === 0) ctx.moveTo(i, waveY);
        else ctx.lineTo(i, waveY);
    }
    ctx.stroke();

    // Dessin du cœur de la particule (le paquet d'ondes)
    ctx.beginPath();
    if (particle.state === "tunneling") {
        ctx.fillStyle = "#ff007f"; // Flash rose lors du tunnel quantique
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff007f";
    } else {
        ctx.fillStyle = "#66fcf1"; // Cyan classique
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#66fcf1";
    }
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset ombre

    // Textes informatifs à l'écran
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.fillText(`Hauteur de la barrière : ${barrier.v0} eV`, barrier.x - 60, 20);
    
    if (particle.state === "tunneling") {
        ctx.fillStyle = "#ff007f";
        ctx.font = "bold 16px Arial";
        ctx.fillText("EFFET TUNNEL QUANTIQUE !", canvas.width / 2 - 110, canvas.height - 40);
    } else if (particle.state === "bouncing") {
        ctx.fillStyle = "#ff3333";
        ctx.font = "bold 16px Arial";
        ctx.fillText("RÉFLEXION CLASSIQUE (E < V0)", canvas.width / 2 - 120, canvas.height - 40);
    }

    requestAnimationFrame(gameLoop);
}

function resetParticle() {
    particle.x = 50;
    particle.state = "idle";
    particle.vx = 0;
    // Met à jour l'énergie avec le slider actuel pour le coup d'après
    particle.energy = parseInt(energySlider.value);
    updateUI();
}

// Lancement du jeu
gameLoop();