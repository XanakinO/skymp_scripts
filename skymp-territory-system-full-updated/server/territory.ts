// server/territory.ts - SKYMP Server Logic
import { mp } from 'skymp5-server';

interface Territory {
  id: string;
  name: string;
  ownerGuildId?: number;
  ownerPlayerId?: number;
  centerPos: { x: number, y: number, z: number };
  radius: number;
  resources: number; // tax pool
  contested: boolean;
  siegeActive: boolean;
  siegeStartTime?: number;
  attackers: number[]; // player IDs participating in siege
  defenders: number[]; // owner + allies
}

const territories: Territory[] = [
  { id: "t1", name: "Whiterun Plains", centerPos: {x: 0, y: 0, z: 0}, radius: 5000, resources: 0, contested: false },
  // Add more territories...
];

export function initTerritorySystem() {
  console.log("[Territory System] Initialized for player-only server with Siege Mechanics");

  mp.on("claimTerritory", (playerId, data) => {
    claimTerritory(playerId);
  });

  mp.on("startSiege", (playerId, data) => {
    startSiege(playerId, data.territoryId);
  });

  mp.on("joinSiege", (playerId, data) => {
    joinSiege(playerId, data.territoryId, data.side);
  });

  // Periodic checks for sieges and taxes
  setInterval(() => {
    processTerritoryTaxes();
    checkActiveSieges();
  }, 300000); // every 5 min
}

function claimTerritory(playerId: number) {
  const playerPos = mp.getPosition(playerId); // assume available
  const territory = findNearestTerritory(playerPos);

  if (territory && !territory.ownerGuildId && !territory.ownerPlayerId) {
    territory.ownerPlayerId = playerId;
    mp.sendChatMessage(0, `Player ${playerId} has claimed ${territory.name}!`);
    broadcastTerritoryUpdate(territory);
  } else {
    mp.sendChatMessage(playerId, "Cannot claim this territory!");
  }
}

function startSiege(attackerId: number, territoryId: string) {
  const territory = territories.find(t => t.id === territoryId);
  if (!territory || territory.siegeActive || !territory.ownerPlayerId) {
    mp.sendChatMessage(attackerId, "Cannot start siege on this territory!");
    return;
  }

  territory.siegeActive = true;
  territory.siegeStartTime = Date.now();
  territory.attackers = [attackerId];
  territory.defenders = [territory.ownerPlayerId];

  mp.sendChatMessage(0, `⚔️ Siege started on ${territory.name} by player ${attackerId}! Defend or join the attack!`);
  broadcastTerritoryUpdate(territory);

  // Siege ends after 30 minutes (configurable)
  setTimeout(() => endSiege(territoryId), 1800000);
}

function joinSiege(playerId: number, territoryId: string, side: 'attack' | 'defend') {
  const territory = territories.find(t => t.id === territoryId);
  if (!territory || !territory.siegeActive) return;

  if (side === 'attack') {
    if (!territory.attackers.includes(playerId)) territory.attackers.push(playerId);
  } else {
    if (!territory.defenders.includes(playerId)) territory.defenders.push(playerId);
  }

  broadcastTerritoryUpdate(territory);
}

function checkActiveSieges() {
  territories.forEach(t => {
    if (t.siegeActive && t.siegeStartTime) {
      const elapsed = Date.now() - t.siegeStartTime;
      if (elapsed > 1800000) { // 30 min
        endSiege(t.id);
      }
    }
  });
}

function endSiege(territoryId: string) {
  const territory = territories.find(t => t.id === territoryId);
  if (!territory || !territory.siegeActive) return;

  const attackerCount = territory.attackers.length;
  const defenderCount = territory.defenders.length;

  if (attackerCount > defenderCount) {
    // Attackers win
    territory.ownerPlayerId = territory.attackers[0]; // or guild logic
    territory.ownerGuildId = undefined;
    mp.sendChatMessage(0, `🏆 ${territory.name} has been conquered by the attackers!`);
  } else {
    mp.sendChatMessage(0, `🛡️ Defenders held ${territory.name}!`);
  }

  territory.siegeActive = false;
  territory.siegeStartTime = undefined;
  territory.attackers = [];
  territory.defenders = [];
  broadcastTerritoryUpdate(territory);
}

function findNearestTerritory(pos: any): Territory | null {
  // Simple distance check
  return territories[0]; // Expand for real use
}

function processTerritoryTaxes() {
  territories.forEach(t => {
    if (t.ownerPlayerId || t.ownerGuildId) {
      t.resources += 100; // Example income from players in area
    }
  });
}

function broadcastTerritoryUpdate(territory: Territory) {
  // Sync to all clients
  mp.sendCustomPacket(0, "territoryUpdate", territory);
}
