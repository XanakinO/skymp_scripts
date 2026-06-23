# Arcane Duels for SkyMP

**High-Fantasy Turn-Based 1v1 Dueling System**

Immersive honor duels with full turn-based combat, challenge system, and rich Skyrim high-fantasy UI.

## Features
- Player-to-player duel challenges
- Full turn-based battle logic (Attack, Spell, Skill, Item, Surrender)
- Specific spell cooldowns (Firebolt 3 turns, Frost Nova 4 turns, Arcane Blast 5 turns)
- High-fantasy leather/parchment UI with candle effects
- Health tracking, battle log, and real-time sync
- Spectator support (basic)
- Server-side validation and persistence

## Installation

### Prerequisites
- Skyrim Special Edition + SkyMP
- Skyrim Platform installed
- Basic knowledge of SkyMP plugin installation

### Client Setup
1. `npm install && npm run build`
2. Copy `dist/index.js` and `ui/` folder to `Data/Platform/Plugins/arcane-duels/`

### Server Setup
1. Copy `ts/DuelSystem.ts` to your server `ts/` folder
2. Import and call `ArcaneDuels.init(mp)` in your main server file

### Server Configuration
Create or edit your server config:
```json
{
  "arcaneDuels": {
    "enabled": true,
    "maxDuelTime": 900,
    "duelCooldown": 180,
    "allowSpectators": true,
    "freezePlayers": true
  }
}
```

## How to Use In-Game
- Approach another player and use the duel hotkey or menu
- Accept/decline challenges
- Fight in beautiful turn-based arena

Enjoy honorable combat on your RP server! ⚔️🕯️