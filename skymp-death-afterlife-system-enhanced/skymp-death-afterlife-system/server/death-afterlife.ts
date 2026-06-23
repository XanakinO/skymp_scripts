import { mp } from 'skymp5-server';

interface Ghost {
  playerId: number;
  deathTime: number;
  pacts: string[];
  soulGemBound?: boolean; // New: Soul gem integration
}

const ghosts: Map<number, Ghost> = new Map();
const activeHaunts: Map<number, number> = new Map(); // targetId -> haunting ghost

export function initDeathAfterlifeSystem() {
  mp.registerPapyrusEvent("OnPlayerDeath", onPlayerDeath);
  console.log("[Death Afterlife System] Initialized with Haunting & Soul Gems");
}

// On death
function onPlayerDeath(playerId: number, killerId: number) {
  const ghost: Ghost = {
    playerId,
    deathTime: Date.now(),
    pacts: [],
    soulGemBound: false
  };
  ghosts.set(playerId, ghost);

  mp.sendChatMessage(0, `Player ${playerId} has entered the Afterlife...`);
}

// Haunting mechanic
mp.on("startHaunting", (ghostId: number, targetId: number) => {
  if (ghosts.has(ghostId)) {
    activeHaunts.set(targetId, ghostId);
    mp.sendChatMessage(targetId, "You feel a ghostly presence haunting you...");
    mp.sendChatMessage(ghostId, `You are now haunting player ${targetId}`);
  }
});

// Soul gem integration (binding a ghost to a soul gem item)
mp.on("bindSoulGem", (performerId: number, ghostId: number) => {
  const ghost = ghosts.get(ghostId);
  if (ghost) {
    ghost.soulGemBound = true;
    // Remove from active ghosts or mark as trapped
    mp.sendChatMessage(0, `Soul of player ${ghostId} has been trapped in a Soul Gem!`);
  }
});

// Revival with soul gem check
mp.on("revivePlayer", (performerId: number, data: any) => {
  const targetId = data.targetId;
  const ghost = ghosts.get(targetId);
  if (ghost && !ghost.soulGemBound) {
    ghosts.delete(targetId);
    activeHaunts.delete(targetId);
    mp.sendChatMessage(0, `Player ${targetId} has been revived!`);
  }
});

setInterval(() => {
  const now = Date.now();
  for (const [id, ghost] of ghosts) {
    if (now - ghost.deathTime > 7200000) { // 2 hours
      ghosts.delete(id);
    }
  }
}, 60000);
