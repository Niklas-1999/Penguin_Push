export function drawAiPenguin3(ctx, floeLayout, spawnPoint) {
  const x = spawnPoint.x;
  const y = spawnPoint.y;
  const size = Math.round(floeLayout.baseSize * 0.2);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillText("🐧", x, y);
  ctx.restore();
}
