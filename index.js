
let catStateAlive = "L'état est maintenant fixé : le chat est vivant ! 🐈";
let catStateDead = "L'état est maintenant fixé : le chat est mort ! 💀";
let catStateLess = "L'état du chat est mort est vivant(superposition) aucune intéraction n'est fait 💀|🐈";

function q1(questionNb, idSelect){
    alert('reponse à la question '+questionNb+' -> '+document.getElementById(idSelect).value);
}

function randomCat(){
    let pCat = document.getElementById("schrodiCat");
    let r = Math.random();
    r = Math.floor(r*100);

    let isDead = (r % 2) == 1;

    pCat.innerHTML = isDead ? catStateDead : catStateAlive;
    pCat.setAttribute("data-value", r%2);
}

function resetCat(){
    let pCat = document.getElementById("schrodiCat");
    pCat.removeAttribute("data-value");
    pCat.innerHTML =catStateLess;
}