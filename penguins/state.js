export function createPenguinState(id, spawnKey, isPlayer = false) {
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

export function createPenguinRoster() {
  return [
    createPenguinState("ai1", "top"),
    createPenguinState("ai2", "left"),
    createPenguinState("ai3", "right"),
    createPenguinState("player", "bottom", true),
  ];
}
