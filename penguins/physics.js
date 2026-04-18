import { isPointInsidePolygon } from "../floe.js";

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

function settleFallingPenguins(penguins, currentTime, fallDelayMs) {
  let playerLost = false;

  penguins.forEach((penguin) => {
    if (penguin.status !== "falling" || penguin.fallStartedAt === null) {
      return;
    }

    if (currentTime - penguin.fallStartedAt < fallDelayMs) {
      return;
    }

    penguin.status = "gone";
    penguin.position = null;

    if (penguin.isPlayer) {
      playerLost = true;
    }
  });

  const allAiGone = penguins
    .filter((penguin) => !penguin.isPlayer)
    .every((penguin) => penguin.status === "gone");

  return { playerLost, allAiGone };
}

export function getPenguinCollisionRadius(penguinSize) {
  return penguinSize * 0.28;
}

export function stepPenguinPhysics({
  penguins,
  deltaSeconds,
  currentTime,
  floePolygon,
  penguinSize,
  dragFactor = 1.45,
  stopSpeed = 9,
  collisionPasses = 3,
  fallDelayMs = 1000,
}) {
  const drag = Math.exp(-dragFactor * deltaSeconds);

  penguins.forEach((penguin) => {
    if (penguin.status !== "active") {
      return;
    }

    penguin.velocityX *= drag;
    penguin.velocityY *= drag;
    penguin.position.x += penguin.velocityX * deltaSeconds;
    penguin.position.y += penguin.velocityY * deltaSeconds;
  });

  const collisionRadius = getPenguinCollisionRadius(penguinSize);

  for (let pass = 0; pass < collisionPasses; pass += 1) {
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

    if (speed < stopSpeed) {
      penguin.velocityX = 0;
      penguin.velocityY = 0;
      penguin.moving = false;
    }
  });

  penguins.forEach((penguin) => {
    if (penguin.status !== "active") {
      return;
    }

    if (!isPenguinInsideFloe(penguin.position, floePolygon, penguinSize)) {
      markPenguinFalling(penguin, currentTime);
    }
  });

  return settleFallingPenguins(penguins, currentTime, fallDelayMs);
}
