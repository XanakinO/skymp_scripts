import { Mp, Actor } from 'skymp5-server';

export class PlayerLiterature {
    static init(mp: Mp) {
        mp.registerEventHandler('Scribes_SaveBook', (actorId: number, data: any) => {
            // DBF file writing logic here (as previously discussed)
            mp.sendChatMessage(actorId, "Your words have been bound into the eternal archives.");
        });
    }
}