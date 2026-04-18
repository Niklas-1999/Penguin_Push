export function drawDirectionArrow(ctx, playerPoint, penguinSize, angle) {
  const orbitRadius = Math.max(penguinSize * 1.2, 26);
  const arrowX = playerPoint.x + Math.cos(angle) * orbitRadius;
  const arrowY = playerPoint.y + Math.sin(angle) * orbitRadius;
  const arrowSize = Math.max(Math.round(penguinSize * 0.75), 18);

  ctx.save();
  ctx.translate(arrowX, arrowY);
  ctx.rotate(angle);

  ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${arrowSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillText("➜", 0, 0);

  ctx.restore();
}
