Director Mode for SkyMP Director Mode is a powerful, real-time Game Master (GM) management tool for SkyMP multiplayer servers. It provides admins with a comprehensive in-game dashboard for controlling events, spawning, world state, players, and more. Full Code Structure Root Files

package.json — Build scripts and dependencies. tsconfig.json — TypeScript configuration. director-config.json — Server-wide settings (admins, limits, features). form-database.json — Extensive FormID database for spawning.

Client Layer (src/index.ts)

Registers the Insert hotkey to toggle the dashboard. Creates and manages the CEF Browser window. Handles all communication between the React UI and the SkyMP server. Supports both development (localhost) and production (local file) modes.

Server Layer (src/server-hooks.ts)

DirectorServer class manages all state (events, players, multipliers, logs). Registers event listeners for GM commands. Performs admin validation, rate limiting, and persistence. Broadcasts live updates to all connected clients. Bridges to Papyrus for actual game world changes.

Papyrus Layer (papyrus/)

DirectorAI.psc — Contains all game-world functions (spawning, AI, weather, quests, etc.). papyrus-integration.ts — Helpers for calling Papyrus from TypeScript.

UI Layer (ui/react-dashboard/)

React + Redux single-page application. Dashboard.tsx — Main dashboard with all panels. Redux slice for live state management. App.css — Skyrim-themed styling. Supporting components: SpawnMenuModal, Minimap, QuestEditor, etc.

How It Works (In-Depth Mechanics)

Activation Admin presses Insert → Client opens CEF browser with React UI. Command Flow UI action → CEF message → index.ts → emitServerEvent → Server processes → Papyrus calls → Broadcast back → UI updates live. Key Systems Events: Create, pause, end with timers and persistence. Spawning: FormID-based with position, AI, and region scoping. World Controls: Time, weather, multipliers with real Papyrus effects. Player Management: Live list with interaction tools. Persistence: SQLite for state across restarts. Security: Rate limiting and admin-only access.

Detailed Installation Server Side

Copy src/server-hooks.ts and director-config.json to your SkyMP server scripts. Edit director-config.json with your SteamIDs. Restart the server.

UI Dashboard

cd ui/react-dashboard npm install && npm run build Copy build/ to Data/Platform/UI/director/

Client Plugin

Build root project (npm run build) Place compiled plugin in SkyMP client plugins.

Papyrus

Compile papyrus/DirectorAI.psc in Creation Kit. Attach to a quest that starts on game load.

Configuration (director-config.json) See the file for all options (admins, limits, features, security, etc.). In-Game Usage

Press Insert as admin. Use panels for events, spawning, world control, and player management. All changes are live and synchronized.

Troubleshooting

Dashboard not loading? Check CEF path in index.ts. Spawns failing? Verify FormIDs and Papyrus quest. Admin commands ignored? Check SteamID in config.

Architecture Benefits

Modular and extensible. Live synchronization. Full SkyMP compatibility.
