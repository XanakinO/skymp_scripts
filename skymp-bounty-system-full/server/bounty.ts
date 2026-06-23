import { mp } from "skymp5-server";

interface Bounty {
  id: string;
  targetId: number;
  placerId: number;
  amount: number;
  reason: string;
  timestamp: number;
  claimedBy?: number;
}

const bounties: Bounty[] = [];
const wantedPlayers = new Set<number>();

export function initBountySystem() {
  // Register custom events
  mp.on("customEvent", handleCustomEvents);

  console.log("[Bounty System] Fully initialized for player-only server");
}

function handleCustomEvents(actorId: number, event: any) {
  if (event.name === "placeBounty") {
    placeBounty(actorId, event.data.targetId, event.data.amount, event.data.reason);
  }
  if (event.name === "claimBounty") {
    claimBounty(actorId, event.data.bountyId);
  }
  if (event.name === "getBounties") {
    mp.sendCustomEvent(actorId, "updateBounties", bounties.filter(b => !b.claimedBy));
  }
  if (event.name === "getOnlinePlayers") {
    const players = mp.getOnlinePlayers ? mp.getOnlinePlayers() : [];
    mp.sendCustomEvent(actorId, "onlinePlayers", players);
  }
}

function placeBounty(placerId: number, targetId: number, amount: number, reason: string): boolean {
  if (amount < 100 || placerId === targetId) {
    mp.sendChatMessage(placerId, "Invalid bounty parameters.");
    return false;
  }

  const bounty: Bounty = {
    id: `b_${Date.now()}_${placerId}`,
    targetId,
    placerId,
    amount,
    reason: reason.substring(0, 100),
    timestamp: Date.now()
  };

  bounties.push(bounty);
  wantedPlayers.add(targetId);

  mp.sendChatMessage(0, `§cA bounty of ${amount} gold has been placed!`);
  mp.sendCustomEventToAll("setWanted", true); // For target player

  return true;
}

function claimBounty(claimerId: number, bountyId: string) {
  const bountyIndex = bounties.findIndex(b => b.id === bountyId && !b.claimedBy);
  if (bountyIndex === -1) return;

  const bounty = bounties[bountyIndex];
  
  // Reward the claimer
  const goldForm = mp.getForm(0xf); // Gold
  if (goldForm) {
    mp.getForm(claimerId)?.addItem(goldForm, bounty.amount, true);
  }

  bounty.claimedBy = claimerId;
  mp.sendChatMessage(claimerId, `§aYou claimed the bounty for ${bounty.amount} gold!`);
  mp.sendChatMessage(0, `Bounty claimed by player ${claimerId}`);
}

// Hook into player death for automatic bounty claims
mp.registerPapyrusEvent("OnPlayerDeath", (targetId: number, killerId: number) => {
  if (killerId === targetId || killerId === 0) return;

  const activeBounties = bounties.filter(b => b.targetId === targetId && !b.claimedBy);
  activeBounties.forEach(b => {
    b.claimedBy = killerId;
    const goldForm = mp.getForm(0xf);
    mp.getForm(killerId)?.addItem(goldForm, b.amount, true);
  });
});
