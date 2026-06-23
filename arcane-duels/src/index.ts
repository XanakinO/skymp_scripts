import * as sp from 'skyrimPlatform';

const MOD_NAME = 'arcane-duels';

sp.on('equip', (e: any) => {
    // Optional: Duel token or spell to open menu
});

sp.registerForMenu('DuelMenu', () => {
    // Handle menu events
});

export function challengePlayer(targetActorId: number) {
    sp.sendEvent('ArcaneDuel_Challenge', { target: targetActorId });
}

sp.browser.setCallback('duelAction', (data: any) => {
    sp.sendEvent('ArcaneDuel_Action', data);
});

console.log('[Arcane Duels] Loaded successfully. Challenge players for honorable combat!');