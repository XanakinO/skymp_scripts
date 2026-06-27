# Director Mode for SkyMP / SkyrimPlatform

This is a starter kit for the GM Dashboard shown in the image.

## Features
- Full React + Redux dashboard 
- NPC & AI Control panel (AI packages, aggression)
- Quest Editor (start/advance/complete quests, objectives)
- Enhanced Spawn Menu modal with categories
- Multipliers sliders with Redux sync
- CEF live-reload dev setup (npm start + localhost)
- Extended server hooks and Papyrus integration points

## React Dashboard Setup (Recommended)

1. Navigate to `ui/react-dashboard`
2. Install dependencies (if you have Node.js locally): `npm install`
3. Build: `npm run build`
4. Copy the `build/` folder contents to your Skyrim `Data/Platform/UI/director/` or serve via localhost for dev.

## CEF Live-Reload Dev Setup (Recommended)
1. In `ui/react-dashboard`: `npm start` (runs on http://localhost:3000)
2. In `src/index.ts`: Browser loads `http://localhost:3000`
3. Changes in React auto-reload in-game (CEF supports it well).
4. For production build: `npm run build`, copy `build/` to `Data/Platform/UI/director/`, update Browser path to local file URL.

Hotkey: Insert to toggle.

## Server-Side Integration (Updated)
1. Copy `src/server-hooks.ts` into your SkyMP server scripts.
2. **Admin Auth**: Edit `isAdmin()` with real SteamID or role checks.
3. **Real Spawning**: Connect `spawnNpc()` and `spawnCreature()` to SkyrimPlatform / Papyrus.
4. **Persistence**: Events are saved to `director-events.json` automatically.

## Recent Updates (Production-Ready Features)
- Real FormIDs for common spawns (Dragon, Bandit, Soldiers, Giant, etc.)
- SQLite persistence for events
- Rate limiting on admin actions
- Enhanced CSS animations and Skyrim-themed polish in React UI (hover effects, fade-ins)

## Recommended Next Steps
- Implement region-scoped events (filter by player location).
- Create custom Papyrus scripts (see `papyrus-integration.ts`).
- Add visual polish to React UI (icons, animations via CSS/Framer Motion).

See `src/papyrus-integration.ts` for deeper game integration.

testing phase 8/15
