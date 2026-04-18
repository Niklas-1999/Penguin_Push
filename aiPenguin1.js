function getAngleToTarget(fromPosition, toPosition) {
  return Math.atan2(toPosition.y - fromPosition.y, toPosition.x - fromPosition.x);
}

export function getAiPenguin1Shot(selfPenguin, playerPenguin, strength) {
  if (!selfPenguin?.position || !playerPenguin?.position) {
    return null;
  }

  return {
    angle: getAngleToTarget(selfPenguin.position, playerPenguin.position),
    strength,
  };
}
