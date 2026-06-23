import { Mp, Actor } from 'skymp5-server';

interface DuelState {
    player1: number;
    player2: number;
    hp1: number;
    hp2: number;
    turn: number;
    cooldowns: { [playerId: number]: { [spell: string]: number } }; // spell -> remaining turns
    activeEffects: any[];
}

export class ArcaneDuels {
    static activeDuels: Map<number, DuelState> = new Map();

    static init(mp: Mp) {
        mp.registerEventHandler('ArcaneDuel_Challenge', (actorId: number, data: any) => {
            mp.sendChatMessage(actorId, "Duel challenge sent!");
            // TODO: Implement full duel logic
        });

        mp.registerEventHandler('ArcaneDuel_Action', (actorId: number, data: any) => {
            const duel = getActiveDuel(actorId);
            if (!duel) return;

            const isPlayer1 = duel.player1 === actorId;
            const playerId = actorId;

            // Handle spell cooldowns
            if (data.action === 'spell' && data.spell) {
                if (isOnCooldown(duel, playerId, data.spell)) {
                    mp.sendChatMessage(actorId, `§c${data.spell} is on cooldown!`);
                    return;
                }
                applyCooldown(duel, playerId, data.spell, 3); // 3 turn cooldown example
            }

            processDuelAction(duel, actorId, data);
            broadcastDuelUpdate(duel);
        });
    }
}

// Helper functions for cooldowns and duel management
function getActiveDuel(actorId: number): DuelState | undefined {
    // Simplified lookup - in real version use proper matching
    for (const duel of ArcaneDuels.activeDuels.values()) {
        if (duel.player1 === actorId || duel.player2 === actorId) {
            return duel;
        }
    }
    return undefined;
}

function isOnCooldown(duel: DuelState, playerId: number, spell: string): boolean {
    if (!duel.cooldowns[playerId]) return false;
    return (duel.cooldowns[playerId][spell] || 0) > 0;
}

function applyCooldown(duel: DuelState, playerId: number, spell: string, turns: number) {
    if (!duel.cooldowns[playerId]) duel.cooldowns[playerId] = {};
    duel.cooldowns[playerId][spell] = turns;
}

function processDuelAction(duel: DuelState, actorId: number, data: any) {
    // Placeholder for full battle logic
    console.log(`[Arcane Duels] Action ${data.action} by ${actorId}`);
}

function broadcastDuelUpdate(duel: DuelState) {
    // Send updates to both players and spectators
    console.log('[Arcane Duels] Broadcasting duel update');
}

function tickCooldowns(duel: DuelState) {
    Object.keys(duel.cooldowns).forEach(playerId => {
        Object.keys(duel.cooldowns[playerId as any]).forEach(spell => {
            if (duel.cooldowns[playerId as any][spell] > 0) {
                duel.cooldowns[playerId as any][spell]--;
            }
        });
    });
}