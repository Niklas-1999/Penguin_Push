import { getAiPenguin1Shot } from "../aiPenguin1.js";
import { getAiPenguin2Shot } from "../aiPenguin2.js";
import { getAiPenguin3Shot } from "../aiPenguin3.js";

export function applyAiShots({ penguins, playerPenguin, strength, floeLayout, applyShotForPenguin }) {
  if (!floeLayout || !playerPenguin.position) {
    return;
  }

  penguins.forEach((penguin) => {
    if (penguin.isPlayer || penguin.status !== "active" || !penguin.position) {
      return;
    }

    let shot = null;

    if (penguin.id === "ai1") {
      shot = getAiPenguin1Shot(penguin, playerPenguin, strength);
    } else if (penguin.id === "ai2") {
      shot = getAiPenguin2Shot(penguin, penguins, strength);
    } else if (penguin.id === "ai3") {
      shot = getAiPenguin3Shot(penguin, floeLayout, strength);
    }

    if (shot) {
      applyShotForPenguin(penguin, shot.angle, shot.strength);
    }
  });
}
