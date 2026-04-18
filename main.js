import { resizeCanvasToViewport } from "./canvas.js";
import {
  createFloeProfile,
  drawIceFloe,
  getCardinalSpawnPoints,
  getFloePolygon,
  getUnscaledPenguinSize,
} from "./floe.js";
import { applyAiShots } from "./ai/shotPlanner.js";
import { createJoystick } from "./joystick.js";
import { drawDirectionArrow } from "./directionArrow.js";
import { createPenguinRoster } from "./penguins/state.js";
import { drawPenguin } from "./penguins/render.js";
import { stepPenguinPhysics } from "./penguins/physics.js";

function initGame() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const floeProfile = createFloeProfile();
  const joystick = createJoystick(document.getElementById("joystick"));
  const strengthSlider = document.getElementById("strengthSlider");
  const strengthValue = document.getElementById("strengthValue");
  const strengthFill = document.getElementById("strengthFill");
  const pushButton = document.getElementById("pushButton");
  const controlPanel = document.getElementById("shotControls");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const tryAgainButton = document.getElementById("tryAgainButton");
  const youWinOverlay = document.getElementById("youWinOverlay");
  const playAgainButton = document.getElementById("playAgainButton");
  const initialStrength = Number(strengthSlider.value) / 100;
  const penguins = createPenguinRoster();
  const playerPenguin = penguins[penguins.length - 1];
  let needsResize = true;
  let previousFrameTime = performance.now();
  let gameOver = false;
  let gameWon = false;
  let floeScale = 1;
  let shouldShrinkAfterRound = false;
  let currentFloePolygon = null;
  let currentFloeLayout = null;
  let currentPenguinSize = 0;
  const shrinkFactorPerRound = 0.92;

  function setGameOverOverlayVisible(visible) {
    gameOverOverlay.hidden = !visible;
  }

  function setYouWinOverlayVisible(visible) {
    youWinOverlay.hidden = !visible;
  }

  function syncStrengthUi() {
    const strengthPercent = Number(strengthSlider.value);

    strengthValue.textContent = `${strengthPercent}%`;
    strengthFill.style.width = `${strengthPercent}%`;
    playerPenguin.aimStrength = strengthPercent / 100;
  }

  function isRoundBusy() {
    return penguins.some((penguin) => penguin.status === "falling" || penguin.moving);
  }

  function setControlsEnabled(enabled) {
    joystick.setEnabled(enabled);
    strengthSlider.disabled = !enabled;
    controlPanel.dataset.mode = enabled ? "ready" : "locked";
  }

  function updatePushAvailability() {
    const roundBusy = isRoundBusy();
    const controlsEnabled = !gameOver && !gameWon && playerPenguin.status === "active" && !roundBusy;

    if (shouldShrinkAfterRound && !roundBusy && !gameOver && !gameWon) {
      floeScale *= shrinkFactorPerRound;
      shouldShrinkAfterRound = false;
    }

    setControlsEnabled(controlsEnabled);
    pushButton.disabled = !controlsEnabled || !joystick.hasSelection();
    pushButton.textContent = roundBusy ? "Sliding..." : "Push";
    pushButton.setAttribute("aria-busy", roundBusy ? "true" : "false");
  }

  function applySpawnPoints(spawnPoints) {
    penguins.forEach((penguin) => {
      penguin.position = { ...spawnPoints[penguin.spawnKey] };
      penguin.velocityX = 0;
      penguin.velocityY = 0;
      penguin.moving = false;
      penguin.status = "active";
      penguin.fallStartedAt = null;
    });
  }

  function resetGame() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    floeScale = 1;
    shouldShrinkAfterRound = false;
    const floeLayout = drawIceFloe(ctx, floeProfile, width, height, floeScale);
    const penguinSize = getUnscaledPenguinSize(width, height);
    const spawnInset = penguinSize * 1.05;
    const spawnPoints = getCardinalSpawnPoints(floeProfile, floeLayout, spawnInset);

    gameOver = false;
    gameWon = false;
    applySpawnPoints(spawnPoints);
    joystick.clearSelection();
    playerPenguin.aimAngle = -Math.PI / 2;
    playerPenguin.aimStrength = initialStrength;
    strengthSlider.value = String(Math.round(initialStrength * 100));
    syncStrengthUi();
    setGameOverOverlayVisible(false);
    setYouWinOverlayVisible(false);
    updatePushAvailability();
  }

  function getShotSpeed(strength) {
    return 120 + strength * 520;
  }

  function applyShotForPenguin(penguin, angle, strength) {
    penguin.aimAngle = angle;
    penguin.aimStrength = strength;
    penguin.velocityX = Math.cos(angle) * getShotSpeed(strength);
    penguin.velocityY = Math.sin(angle) * getShotSpeed(strength);
    penguin.moving = true;
  }

  function startShot() {
    const roundBusy = isRoundBusy();

    if (gameOver || playerPenguin.status !== "active" || roundBusy || !joystick.hasSelection() || !playerPenguin.position) {
      return;
    }

    const angle = joystick.getAngle();
    const strength = Number(strengthSlider.value) / 100;

    playerPenguin.aimAngle = angle;
    applyShotForPenguin(playerPenguin, angle, strength);
    applyAiShots({
      penguins,
      playerPenguin,
      strength,
      floeLayout: currentFloeLayout,
      applyShotForPenguin,
    });
    shouldShrinkAfterRound = true;
    updatePushAvailability();
    syncStrengthUi();
  }

  function handleRoundOutcome(outcome) {
    if (outcome.playerLost) {
      gameOver = true;
      setGameOverOverlayVisible(true);
      return;
    }

    if (outcome.allAiGone && !gameWon && !gameOver) {
      gameWon = true;
      setYouWinOverlayVisible(true);
    }
  }

  function drawScene(deltaSeconds, currentTime) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.clearRect(0, 0, width, height);
    const floeLayout = drawIceFloe(ctx, floeProfile, width, height, floeScale);
    currentFloeLayout = floeLayout;
    currentFloePolygon = getFloePolygon(floeProfile, floeLayout);
    currentPenguinSize = getUnscaledPenguinSize(width, height);
    const hasSelection = joystick.hasSelection();

    if (playerPenguin.status === "active" && hasSelection && !gameOver && !gameWon) {
      playerPenguin.aimAngle = joystick.getAngle();
    }

    if (!gameOver && !gameWon) {
      const outcome = stepPenguinPhysics({
        penguins,
        deltaSeconds,
        currentTime,
        floePolygon: currentFloePolygon,
        penguinSize: currentPenguinSize,
      });

      handleRoundOutcome(outcome);
    }

    penguins.forEach((penguin) => {
      drawPenguin(ctx, penguin, currentPenguinSize);
    });

    if (hasSelection && playerPenguin.status === "active" && playerPenguin.position && !gameOver) {
      drawDirectionArrow(ctx, playerPenguin.position, currentPenguinSize, playerPenguin.aimAngle);
    }

    updatePushAvailability();
  }

  function onResize() {
    resizeCanvasToViewport(canvas, ctx);
    needsResize = true;
  }

  window.addEventListener("resize", onResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onResize);
  }

  strengthSlider.addEventListener("input", () => {
    syncStrengthUi();
  });

  pushButton.addEventListener("click", startShot);
  tryAgainButton.addEventListener("click", resetGame);
  playAgainButton.addEventListener("click", resetGame);

  onResize();
  syncStrengthUi();
  setGameOverOverlayVisible(false);
  setYouWinOverlayVisible(false);
  resetGame();
  updatePushAvailability();

  function renderFrame(timestamp) {
    const deltaSeconds =
      previousFrameTime === 0 ? 0 : Math.min((timestamp - previousFrameTime) / 1000, 0.05);

    previousFrameTime = timestamp;

    if (needsResize) {
      needsResize = false;
    }

    drawScene(deltaSeconds, timestamp);
    window.requestAnimationFrame(renderFrame);
  }

  window.requestAnimationFrame(renderFrame);
}

initGame();
