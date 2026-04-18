export function createFloeProfile(pointCount = 18) {
  const points = [];

  for (let i = 0; i < pointCount; i += 1) {
    const angle = (i / pointCount) * Math.PI * 2;

    // Keep the same overall silhouette, then add small per-reload variation.
    const baseShape =
      1 + 0.12 * Math.sin(angle * 2 + 0.4) + 0.06 * Math.cos(angle * 3 - 0.6);
    const variation = 1 + (Math.random() * 2 - 1) * 0.1;
    const radius = baseShape * variation;

    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }

  return points;
}

export function getFloeLayout(width, height) {
  const minDimension = Math.min(width, height);
  const baseSize = Math.max(140, Math.min(minDimension * 0.31, 330));

  return {
    centerX: width * 0.5,
    centerY: height * 0.52,
    baseSize,
    radiusX: baseSize * 1.15,
    radiusY: baseSize * 0.95,
  };
}

function getFloePoint(layout, point) {
  const verticalBulge = 1 + 0.12 * Math.abs(point.y);

  return {
    x: layout.centerX + point.x * layout.radiusX,
    y: layout.centerY + point.y * layout.radiusY * verticalBulge,
  };
}

function buildFloePolygon(profile, layout) {
  return profile.map((point) => getFloePoint(layout, point));
}

export function getFloePolygon(profile, layout) {
  return buildFloePolygon(profile, layout);
}

export function isPointInsidePolygon(point, polygon) {
  let isInside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const start = polygon[i];
    const end = polygon[j];
    const intersects =
      (start.y > point.y) !== (end.y > point.y) &&
      point.x <
        ((end.x - start.x) * (point.y - start.y)) / (end.y - start.y + 0.0000001) + start.x;

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function cross2D(a, b) {
  return a.x * b.y - a.y * b.x;
}

function getRayDistanceToPolygon(center, direction, polygon) {
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < polygon.length; i += 1) {
    const edgeStart = polygon[i];
    const edgeEnd = polygon[(i + 1) % polygon.length];
    const segment = {
      x: edgeEnd.x - edgeStart.x,
      y: edgeEnd.y - edgeStart.y,
    };
    const toEdgeStart = {
      x: edgeStart.x - center.x,
      y: edgeStart.y - center.y,
    };
    const denominator = cross2D(direction, segment);

    if (Math.abs(denominator) < 1e-7) {
      continue;
    }

    const rayDistance = cross2D(toEdgeStart, segment) / denominator;
    const segmentPosition = cross2D(toEdgeStart, direction) / denominator;

    if (rayDistance >= 0 && segmentPosition >= 0 && segmentPosition <= 1) {
      bestDistance = Math.min(bestDistance, rayDistance);
    }
  }

  if (!Number.isFinite(bestDistance)) {
    return null;
  }

  return bestDistance;
}

export function getCardinalSpawnPoints(profile, layout, inset = 0) {
  const polygon = buildFloePolygon(profile, layout);
  const center = { x: layout.centerX, y: layout.centerY };
  const directions = {
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const fallbackDistances = {
    top: layout.radiusY,
    bottom: layout.radiusY,
    left: layout.radiusX,
    right: layout.radiusX,
  };
  const spawns = {};

  Object.entries(directions).forEach(([key, direction]) => {
    const edgeDistance =
      getRayDistanceToPolygon(center, direction, polygon) ?? fallbackDistances[key];
    const spawnDistance = Math.max(edgeDistance - inset, inset * 0.6);

    spawns[key] = {
      x: center.x + direction.x * spawnDistance,
      y: center.y + direction.y * spawnDistance,
    };
  });

  return spawns;
}

export function drawIceFloe(ctx, profile, width, height) {
  const layout = getFloeLayout(width, height);
  const polygon = buildFloePolygon(profile, layout);

  ctx.beginPath();

  polygon.forEach((point, index) => {
    const x = point.x;
    const y = point.y;

    if (index === 0) {
      ctx.moveTo(x, y);
      return;
    }

    ctx.lineTo(x, y);
  });

  ctx.closePath();
  ctx.fillStyle = "rgba(186, 232, 255, 0.9)";
  ctx.fill();

  ctx.strokeStyle = "rgba(118, 178, 211, 0.85)";
  ctx.lineWidth = Math.max(2, Math.min(layout.baseSize * 0.012, 5));
  ctx.stroke();

  return layout;
}
