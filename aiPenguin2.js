function getAngleToTarget(fromPosition, toPosition) {
  return Math.atan2(toPosition.y - fromPosition.y, toPosition.x - fromPosition.x);
}

export function getAiPenguin2Shot(selfPenguin, penguins, strength) {
  if (!selfPenguin?.position) {
    return null;
  }

  const nearestPenguin = penguins
    .filter((candidate) => candidate !== selfPenguin && candidate.status === "active" && candidate.position)
    .reduce((bestPenguin, candidate) => {
      if (!bestPenguin) {
        return candidate;
      }

      const bestDistance = Math.hypot(
        bestPenguin.position.x - selfPenguin.position.x,
        bestPenguin.position.y - selfPenguin.position.y,
      );
      const candidateDistance = Math.hypot(
        candidate.position.x - selfPenguin.position.x,
        candidate.position.y - selfPenguin.position.y,
      );

      return candidateDistance < bestDistance ? candidate : bestPenguin;
    }, null);

  if (!nearestPenguin) {
    return null;
  }

  return {
    angle: getAngleToTarget(selfPenguin.position, nearestPenguin.position),
    strength,
  };
}
