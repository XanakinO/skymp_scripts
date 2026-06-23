import { mp } from 'skymp5-server';

interface Artifact {
  id: string;
  ownerId: number;
  baseFormId: number;
  soulGemId: number;
  effect: string;
  powerLevel: number;
  isLegendary: boolean;
}

interface Ritual {
  id: string;
  leaderId: number;
  participants: number[];
  baseItemId: number;
  soulGemId: number;
  effect: string;
  startTime: number;
}

const artifacts: Artifact[] = [];
const playerEnchantingSkill = new Map<number, number>(); // playerId -> skill level
const activeRituals: Ritual[] = [];

export function initEnchantingSystem() {
  console.log("[Custom Enchanting] System Initialized");

  mp.on("craftArtifact", (actorId: number, data: any) => {
    if (!canCraft(actorId, data)) {
      mp.sendChatMessage(actorId, "You lack the required materials or skill.");
      return;
    }

    const isRitual = data.isRitual || false;
    const participants = data.participants || [];

    let powerLevel = (playerEnchantingSkill.get(actorId) || 1);
    let isLegendary = false;

    if (isRitual && participants.length >= 2) {
      powerLevel = Math.min(powerLevel + 50, 150);
      isLegendary = true;
      // Award exp to all participants
      participants.forEach(p => gainEnchantingExperience(p, 30));
    }

    const artifact: Artifact = {
      id: `art_${Date.now()}`,
      ownerId: actorId,
      baseFormId: data.baseItemId,
      soulGemId: data.soulGemId,
      effect: data.effectId,
      powerLevel,
      isLegendary
    };

    artifacts.push(artifact);
    
    // Simulate giving the item to player
    mp.getForm(actorId)?.addItem(mp.getForm(data.baseItemId), 1, true);
    
    mp.sendChatMessage(0, isLegendary 
      ? `A LEGENDARY artifact has been forged through a grand ritual!` 
      : `A powerful new artifact has been created by a player!`);
  });

  // Ritual management
  mp.on("startRitual", (actorId: number, data: any) => {
    const ritual: Ritual = {
      id: `rit_${Date.now()}`,
      leaderId: actorId,
      participants: [actorId],
      baseItemId: data.baseItemId,
      soulGemId: data.soulGemId,
      effect: data.effect,
      startTime: Date.now()
    };
    activeRituals.push(ritual);
    mp.sendChatMessage(0, `A ritual ceremony has begun! Players may join.`);
  });
}

function canCraft(actorId: number, data: any): boolean {
  const skill = playerEnchantingSkill.get(actorId) || 0;
  return skill >= 25 && data.soulGemId && data.baseItemId;
}

// Example: Increase skill when player performs rituals or trades
export function gainEnchantingExperience(playerId: number, amount: number) {
  let current = playerEnchantingSkill.get(playerId) || 0;
  playerEnchantingSkill.set(playerId, Math.min(current + amount, 100));
}