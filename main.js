import { resizeCanvasToViewport } from "./canvas.js";
import {
  createFloeProfile,
  drawIceFloe,
  getCardinalSpawnPoints,
  getFloePolygon,
  isPointInsidePolygon,
} from "./floe.js";
import { getAiPenguin1Shot } from "./aiPenguin1.js";
import { getAiPenguin2Shot } from "./aiPenguin2.js";
import { getAiPenguin3Shot } from "./aiPenguin3.js";
import { createJoystick } from "./joystick.js";
import { drawDirectionArrow } from "./directionArrow.js";

function createPenguinState(id, spawnKey, isPlayer = false) {
  return {
    id,
    spawnKey,
    isPlayer,
    position: null,
    velocityX: 0,
    velocityY: 0,
    aimAngle: -Math.PI / 2,
    aimStrength: 0.55,
    moving: false,
    status: "active",
    fallStartedAt: null,
  };
}

function drawEmoji(ctx, point, size, emoji) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillText(emoji, point.x, point.y);
  ctx.restore();
}

function drawPenguin(ctx, penguin, floeLayout, penguinSize) {
  if (!penguin.position || penguin.status === "gone") {
    return;
  }

  const emoji = penguin.status === "falling" ? "💦" : "🐧";
  const size = penguin.status === "falling" ? Math.round(penguinSize * 0.95) : penguinSize;

  drawEmoji(ctx, penguin.position, size, emoji);
}

function getPenguinCollisionRadius(penguinSize) {
  return penguinSize * 0.28;
}

function getPenguinBodySamplePoints(position, penguinSize) {
  const bodyWidth = penguinSize * 0.28;
  const bodyHeight = penguinSize * 0.38;
  const footOffsetY = penguinSize * 0.12;
  const supportWidth = penguinSize * 0.14;
  const supportHeight = penguinSize * 0.05;

  return [
    { x: position.x, y: position.y },
    { x: position.x + bodyWidth * 0.5, y: position.y - bodyHeight * 0.08 },
    { x: position.x - bodyWidth * 0.5, y: position.y - bodyHeight * 0.08 },
    { x: position.x + bodyWidth * 0.22, y: position.y + bodyHeight * 0.22 },
    { x: position.x - bodyWidth * 0.22, y: position.y + bodyHeight * 0.22 },
    { x: position.x + supportWidth * 0.45, y: position.y + footOffsetY },
    { x: position.x - supportWidth * 0.45, y: position.y + footOffsetY },
    { x: position.x + supportWidth * 0.45, y: position.y + footOffsetY + supportHeight },
    { x: position.x - supportWidth * 0.45, y: position.y + footOffsetY + supportHeight },
  ];
}

function isPenguinInsideFloe(position, polygon, penguinSize) {
  return getPenguinBodySamplePoints(position, penguinSize).every((point) =>
    isPointInsidePolygon(point, polygon),
  );
}

function resolvePenguinCollision(firstPenguin, secondPenguin, collisionRadius) {
  if (firstPenguin.status !== "active" || secondPenguin.status !== "active") {
    return;
  }

  const dx = secondPenguin.position.x - firstPenguin.position.x;
  const dy = secondPenguin.position.y - firstPenguin.position.y;
  const distance = Math.hypot(dx, dy);
  const minimumDistance = collisionRadius * 2;

  if (distance >= minimumDistance) {
    return;
  }

  const normalX = distance === 0 ? 1 : dx / distance;
  const normalY = distance === 0 ? 0 : dy / distance;
  const overlap = minimumDistance - (distance === 0 ? 0.0001 : distance);
  const correctionX = normalX * overlap * 0.5;
  const correctionY = normalY * overlap * 0.5;

  firstPenguin.position.x -= correctionX;
  firstPenguin.position.y -= correctionY;
  secondPenguin.position.x += correctionX;
  secondPenguin.position.y += correctionY;

  const relativeVelocityX = secondPenguin.velocityX - firstPenguin.velocityX;
  const relativeVelocityY = secondPenguin.velocityY - firstPenguin.velocityY;
  const velocityAlongNormal = relativeVelocityX * normalX + relativeVelocityY * normalY;

  if (velocityAlongNormal >= 0) {
    return;
  }

  const restitution = 0.26;
  const impulse = -(1 + restitution) * velocityAlongNormal * 0.5;

  firstPenguin.velocityX -= impulse * normalX;
  firstPenguin.velocityY -= impulse * normalY;
  secondPenguin.velocityX += impulse * normalX;
  secondPenguin.velocityY += impulse * normalY;
}

function createPenguinRoster() {
  return [
    createPenguinState("ai1", "top"),
    createPenguinState("ai2", "left"),
    createPenguinState("ai3", "right"),
    createPenguinState("player", "bottom", true),
  ];
}

function getUnscaledPenguinSize(width, height) {
  const minDimension = Math.min(width, height);
  const unscaledBaseSize = Math.max(140, Math.min(minDimension * 0.31, 330));

  return Math.round(unscaledBaseSize * 0.2);
}

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

  function setControlsEnabled(enabled) {
    joystick.setEnabled(enabled);
    strengthSlider.disabled = !enabled;
    controlPanel.dataset.mode = enabled ? "ready" : "locked";
  }

  function updatePushAvailability() {
    const roundBusy = penguins.some((penguin) => penguin.status === "falling" || penguin.moving);
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

  function prepareAiShots(strength) {
    if (!currentFloeLayout || !playerPenguin.position) {
      return;
    }

    penguins.forEach((penguin) => {
      if (penguin.isPlayer || penguin.status !== "active" || !penguin.position) {
        return;
      }

      if (penguin.id === "ai1") {
        const shot = getAiPenguin1Shot(penguin, playerPenguin, strength);

        if (shot) {
          applyShotForPenguin(penguin, shot.angle, shot.strength);
        }

        return;
      }

      if (penguin.id === "ai2") {
        const shot = getAiPenguin2Shot(penguin, penguins, strength);

        if (shot) {
          applyShotForPenguin(penguin, shot.angle, shot.strength);
        }

        return;
      }

      if (penguin.id === "ai3") {
        const shot = getAiPenguin3Shot(penguin, currentFloeLayout, strength);

        if (shot) {
          applyShotForPenguin(penguin, shot.angle, shot.strength);
        }
      }
    });
  }

  function startShot() {
    const roundBusy = penguins.some((penguin) => penguin.status === "falling" || penguin.moving);

    if (gameOver || playerPenguin.status !== "active" || roundBusy || !joystick.hasSelection() || !playerPenguin.position) {
      return;
    }

    const angle = joystick.getAngle();
    const strength = Number(strengthSlider.value) / 100;

    playerPenguin.aimAngle = angle;
    applyShotForPenguin(playerPenguin, angle, strength);
    prepareAiShots(strength);
    shouldShrinkAfterRound = true;
    updatePushAvailability();
    syncStrengthUi();
  }

  function markPenguinFalling(penguin, currentTime) {
    if (penguin.status !== "active") {
      return;
    }

    penguin.status = "falling";
    penguin.fallStartedAt = currentTime;
    penguin.velocityX = 0;
    penguin.velocityY = 0;
    penguin.moving = false;
  }

  function settleFallingPenguins(currentTime) {
    let playerLost = false;

    penguins.forEach((penguin) => {
      if (penguin.status !== "falling" || penguin.fallStartedAt === null) {
        return;
      }

      if (currentTime - penguin.fallStartedAt < 1000) {
        return;
      }

      penguin.status = "gone";
      penguin.position = null;

      if (penguin.isPlayer) {
        playerLost = true;
      }
    });

    if (playerLost) {
      gameOver = true;
      setGameOverOverlayVisible(true);
      return;
    }

    if (gameWon || gameOver) {
      return;
    }

    const aiPenguins = penguins.filter((penguin) => !penguin.isPlayer);
    const allAiGone = aiPenguins.every((penguin) => penguin.status === "gone");

    if (allAiGone) {
      gameWon = true;
      setYouWinOverlayVisible(true);
    }
  }

  function updatePenguinPhysics(deltaSeconds, currentTime) {
    if (gameOver || !currentFloePolygon) {
      return;
    }

    const drag = Math.exp(-1.45 * deltaSeconds);

    penguins.forEach((penguin) => {
      if (penguin.status !== "active") {
        return;
      }

      penguin.velocityX *= drag;
      penguin.velocityY *= drag;
      penguin.position.x += penguin.velocityX * deltaSeconds;
      penguin.position.y += penguin.velocityY * deltaSeconds;
    });

    const collisionRadius = getPenguinCollisionRadius(currentPenguinSize);

    for (let pass = 0; pass < 3; pass += 1) {
      for (let i = 0; i < penguins.length; i += 1) {
        for (let j = i + 1; j < penguins.length; j += 1) {
          resolvePenguinCollision(penguins[i], penguins[j], collisionRadius);
        }
      }
    }

    penguins.forEach((penguin) => {
      if (penguin.status !== "active") {
        return;
      }

      const speed = Math.hypot(penguin.velocityX, penguin.velocityY);

      if (speed < 9) {
        penguin.velocityX = 0;
        penguin.velocityY = 0;
        penguin.moving = false;
      }
    });

    penguins.forEach((penguin) => {
      if (penguin.status !== "active") {
        return;
      }

      if (!isPenguinInsideFloe(penguin.position, currentFloePolygon, currentPenguinSize)) {
        markPenguinFalling(penguin, currentTime);
      }
    });

    settleFallingPenguins(currentTime);
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

    if (playerPenguin.status === "active" && hasSelection && !gameOver) {
      playerPenguin.aimAngle = joystick.getAngle();
    }

    updatePenguinPhysics(deltaSeconds, currentTime);

    penguins.forEach((penguin) => {
      drawPenguin(ctx, penguin, floeLayout, currentPenguinSize);
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
