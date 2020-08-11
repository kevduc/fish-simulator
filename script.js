let player = document.querySelector("#player");
let canne = document.querySelector("#canne");
let ligne = document.querySelector("#ligne");
let fish = document.querySelector("#fish");
let divDistance = document.querySelector("#distance");
let divScore = document.querySelector("#score");
let divTime = document.querySelector("#time");
let divOverlay = document.querySelector("#overlay");
let divVibration = document.querySelector("#vibration");
let vibrateCheckbox = document.querySelector("#vibrate");
let goneTimeout = null;
let pulling = false;
let distance;
let checkInterval = null;
let score = 0;
let nextChange = null;
let waitTimeout = null;
let totalWaitPenalty = 0;
let gameEnd = false;
let firstClick = true;

const deltaCheck = 250;
const distance_max = 100;
const t_min = 5;
const t_max = 25;
const FlattenFactor = 8;

const WaitPenalty = 1000;
const MaxTotalWaitPenalty = 5000;
const FishClassSize = ["x-small", "small", "medium", "big", "x-big"];
const FishWeight = [1, 2, 5, 15, 25];

let vibrationsEnabled = false;
vibrateCheckbox.checked = vibrationsEnabled;
vibrateCheckbox.addEventListener("change", () => {
  vibrationsEnabled = vibrateCheckbox.checked;
});

fish.addEventListener("animationend", () => {
  fish.style.display = "none";
});

divOverlay.addEventListener("mousedown", playerPullStart);
divOverlay.addEventListener("mouseup", playerPullStop);
divOverlay.addEventListener("touchstart", playerPullStart);
divOverlay.addEventListener("touchend", playerPullStop);

function playerPullStart() {
  player.classList.add("player-pull");
  canne.classList.add("canne-pull");
  ligne.classList.add("ligne-pull");
  if (gameEnd) return;

  pulling = true;
  if (goneTimeout !== null) {
    console.debug("Let's try to catch that fish!");
    window.clearTimeout(goneTimeout);
    goneTimeout = null;
    vibrate(75);
    tryCatchFish();
  } else if (waitTimeout !== null) {
    if (firstClick) {
      firstClick = false;
      return;
    }
    window.clearTimeout(waitTimeout);
    waitTimeout = null;
    console.debug("Being impatient scares the fish away!");
    totalWaitPenalty += WaitPenalty;
    if (totalWaitPenalty > MaxTotalWaitPenalty)
      totalWaitPenalty = MaxTotalWaitPenalty;
    generateRandomFish();
  }
}

function playerPullStop() {
  player.classList.remove("player-pull");
  canne.classList.remove("canne-pull");
  ligne.classList.remove("ligne-pull");
  pulling = false;
}

async function generateRandomFish() {
  if (gameEnd) return;
  console.debug("Waiting for a fish...");
  waitTimeout = window.setTimeout(() => {
    if (gameEnd) return;
    waitTimeout = null;
    totalWaitPenalty -= 2 * WaitPenalty;
    if (totalWaitPenalty < 0) totalWaitPenalty = 0;
    console.debug("Found a fish!");
    ligne.classList.replace("wiggle", "fish-caught");
    vibrate([50, 0, 50]);
    goneTimeout = window.setTimeout(() => {
      goneTimeout = null;
      console.debug("Fish is gone");
      vibrate(50);
      ligne.classList.replace("fish-caught", "wiggle");
      generateRandomFish();
    }, Math.random() * 1000 + 3000);
  }, Math.random() * 3000 + 5000 + totalWaitPenalty);
}

async function tryCatchFish() {
  const time =
    t_min +
    ((Math.pow(Math.random() + 1, FlattenFactor) - 1) /
      (Math.pow(2, FlattenFactor) - 1)) *
      (t_max - t_min);
  strength = ((distance_max / time) * deltaCheck) / 1000; // limit number of seconds to pull fish from distance max
  distance = 25 + Math.random() * 50;
  console.debug(`Strength: ${strength}`);
  let distancePercent = Math.round((100 * distance) / distance_max);
  divDistance.innerHTML = `Distance:&nbsp;${
    Math.ceil((distancePercent / 100) * 200) / 10
  }m`;
  toggleFishState();
  checkInterval = window.setInterval(() => {
    if (ligne.classList.contains("fish-pull")) {
      if (pulling) distance -= strength;
      else distance += (strength * (4 * (5.1 - strength))) / 4;
    } else {
      if (pulling) distance += (strength * (2 * (5.1 - strength))) / 4;
      else distance += 0.25 * strength;
    }

    if (distance < 0) distance = 0;
    if (distance > 100) distance = 100;

    distancePercent = distance / distance_max;

    divDistance.innerHTML = `Distance:&nbsp;${
      Math.ceil(distancePercent * 20 * 10) / 10
    }m`;
    divDistance.style.width = `${Math.round(100 * distancePercent)}%`;
    let r = distancePercent;
    divDistance.style.backgroundColor = `rgb(${255 * r},${255 * (1 - r)},${0})`;

    if (gameEnd || distance <= 0 || distance >= distance_max) {
      window.clearTimeout(nextChange);
      window.clearInterval(checkInterval);
      ligne.classList.remove("fish-caught");
      ligne.classList.remove("fish-pull");
      ligne.classList.add("wiggle");
      divDistance.style.backgroundColor = "";
      divDistance.innerHTML = "&nbsp;";
      let rank =
        (strength < 4) + (strength < 3.5) + (strength < 2) + (strength < 1.35);
      if (distance <= 0) {
        console.debug("Caught a fish!");
        vibrate([75, 0, 75]);
        window.setTimeout(() => {
          score += FishWeight[rank];
          divScore.innerText = `Score: ${score}kg of fish`;
        }, 1000);
        fish.className = "";
        fish.classList.add(FishClassSize[rank]);
        fish.style.display = "block";
      } else {
        console.debug("Fish escaped!");
        vibrate(150);
      }
      generateRandomFish();
    }
  }, deltaCheck);
}

function toggleFishState() {
  console.debug("Fish changes state");
  if (ligne.classList.contains("fish-pull")) {
    ligne.classList.replace("fish-pull", "fish-caught");
    vibrate(75);
  } else {
    ligne.classList.replace("fish-caught", "fish-pull");
    vibrate(120);
  }
  nextChange = window.setTimeout(toggleFishState, 2000 + Math.random() * 3500);
}

let timeLeft = 5 * 60;

function updateTime() {
  divTime.innerHTML = `Time: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60)
    .toString()
    .padStart(2, "0")}`;
}

updateTime();
let mainTimer = window.setInterval(() => {
  timeLeft--;
  updateTime();
  if (timeLeft === 0) {
    window.clearInterval(mainTimer);
    gameEnd = true;
    vibrate([100, 0, 100, 0, 100]);
    divScore.innerHTML = `Well done, you managed to get <b>${score}kg of fish</b>! Get the barbecue ready!`;
  }
}, 1000);

if (isMobile()) {
  divVibration.style.display = "block";
}

generateRandomFish();

// Helper

function isMobile() {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
  ];

  return toMatch.some((toMatchItem) => {
    return navigator.userAgent.match(toMatchItem);
  });
}

function vibrate(time) {
  if (vibrationsEnabled) window.navigator.vibrate(time);
}
