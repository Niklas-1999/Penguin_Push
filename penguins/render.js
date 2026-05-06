function drawEmoji(ctx, point, size, emoji) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillText(emoji, point.x, point.y);
  ctx.restore();
}

export function drawPenguin(ctx, penguin, penguinSize, viewRotation = 0) {
  if (!penguin.position || penguin.status === "gone") {
    return;
  }

  const emoji = penguin.status === "falling" ? "💦" : "🐧";
  const size = penguin.status === "falling" ? Math.round(penguinSize * 0.95) : penguinSize;

  ctx.save();
  ctx.translate(penguin.position.x, penguin.position.y);
  ctx.rotate(-viewRotation);

  if (penguin.isPlayer) {
    const ringRadius = size * 0.64;
    const ringWidth = Math.max(size * 0.12, 4);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(252, 212, 75, 0.95)";
    ctx.lineWidth = ringWidth;
    ctx.stroke();
  }

  drawEmoji(ctx, { x: 0, y: 0 }, size, emoji);
  ctx.restore();
}
