function getAngleToTarget(fromPosition, toPosition) {
  return Math.atan2(toPosition.y - fromPosition.y, toPosition.x - fromPosition.x);
}

export function getAiPenguin3Shot(selfPenguin, floeLayout, strength) {
  if (!selfPenguin?.position || !floeLayout) {
    return null;
  }

  const centerAngle = getAngleToTarget(selfPenguin.position, {
    x: floeLayout.centerX,
    y: floeLayout.centerY,
  });
  const wobble = (Math.random() - 0.5) * 1.0;

  return {
    angle: centerAngle + wobble,
    strength,
  };
}
