import { resizeCanvasToViewport } from "./canvas.js";
import { createFloeProfile, drawIceFloe, getCardinalSpawnPoints } from "./floe.js";
import { drawPlayerPenguin } from "./playerPenguin.js";
import { drawAiPenguin1 } from "./aiPenguin1.js";
import { drawAiPenguin2 } from "./aiPenguin2.js";
import { drawAiPenguin3 } from "./aiPenguin3.js";
import { createJoystick } from "./joystick.js";
import { drawDirectionArrow } from "./directionArrow.js";

function initGame() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const floeProfile = createFloeProfile();
  const joystick = createJoystick(document.getElementById("joystick"));
  let needsResize = true;

  function drawScene() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.clearRect(0, 0, width, height);
    const floeLayout = drawIceFloe(ctx, floeProfile, width, height);
    const penguinSize = Math.round(floeLayout.baseSize * 0.2);
    const spawnInset = penguinSize * 0.55;
    const spawnPoints = getCardinalSpawnPoints(floeProfile, floeLayout, spawnInset);

    drawPlayerPenguin(ctx, floeLayout, spawnPoints.bottom);
    drawAiPenguin1(ctx, floeLayout, spawnPoints.top);
    drawAiPenguin2(ctx, floeLayout, spawnPoints.left);
    drawAiPenguin3(ctx, floeLayout, spawnPoints.right);

    if (joystick.isActive()) {
      drawDirectionArrow(ctx, spawnPoints.bottom, penguinSize, joystick.getAngle());
    }
  }

  function onResize() {
    resizeCanvasToViewport(canvas, ctx);
    needsResize = true;
  }

  window.addEventListener("resize", onResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onResize);
  }

  onResize();

  function renderFrame() {
    if (needsResize) {
      needsResize = false;
    }

    drawScene();
    window.requestAnimationFrame(renderFrame);
  }

  renderFrame();
}

initGame();
