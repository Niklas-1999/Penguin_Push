export function resizeCanvasToViewport(canvas, ctx) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(window.innerWidth);
  const height = Math.floor(window.innerHeight);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { width, height };
}
