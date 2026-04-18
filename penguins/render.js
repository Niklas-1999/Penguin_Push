function drawEmoji(ctx, point, size, emoji) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillText(emoji, point.x, point.y);
  ctx.restore();
}

export function drawPenguin(ctx, penguin, penguinSize) {
  if (!penguin.position || penguin.status === "gone") {
    return;
  }

  const emoji = penguin.status === "falling" ? "💦" : "🐧";
  const size = penguin.status === "falling" ? Math.round(penguinSize * 0.95) : penguinSize;

  drawEmoji(ctx, penguin.position, size, emoji);
}
