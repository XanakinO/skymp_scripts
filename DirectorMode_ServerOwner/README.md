# DungemonDirector — Standalone Skymp Plugin

## What Is This?

**DungemonDirector** is a standalone, open-source admin director plugin for **Skymp**, the multiplayer mod framework for *The Elder Scrolls V: Skyrim Special Edition*. It provides an Arma 3 Zeus-inspired in-game interface that allows server administrators and event game masters to spawn actors, items, and buildings; manage waypoint paths; and broadcast changes to all connected players.

This document contains everything needed to understand, install, configure, and extend the plugin.

---

## Background: Skymp and Skyrim Multiplayer

### The Game
*The Elder Scrolls V: Skyrim Special Edition* (2016) is an open-world single-player RPG. The modding community has created multiplayer experiences through SKSE (Skyrim Script Extender), which allows custom code to run inside the game.

### The Framework
**Skymp** is a multiplayer mod framework built on three pillars:

- **Client:** Skyrim + SKSE + SkyrimPlatform (a TypeScript/Chromium runtime injected into the game) + Papyrus VM (Bethesda's in-game scripting language)
- **Server:** A C++ core with a TypeScript plugin system that handles authoritative game state, networking via WebSocket, and persistence (files or MongoDB)
- **Plugin model:** Server-side TypeScript plugins register chat commands, network handlers, and game events. Client-side plugins run inside the game process and can display UI via CEF (Chromium Embedded Framework)

The critical design principle is **server authority**: the server decides what is true, and clients render it. Client-only changes are local-only unless the server explicitly broadcasts them.

### Why a Director Plugin?
Roleplay (RP) and event servers need game masters (GMs) to:
- Spawn actors for an event quickly
- Place items or buildings in the world
- Make NPCs walk predefined paths
- Clean up spawned objects after events end
- Do all of this without knowing FormIDs or typing complex commands

DungemonDirector replaces chat-command-only tools with a visual, three-column interface modeled after the **Arma 3 Zeus** editor — flat, dark, utilitarian, and fast.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     SKYRIM CLIENT                        │
│  ┌─────────────┐    ┌──────────────────────────────┐   │
│  │ Papyrus VM  │    │ CEF Browser (zeus.html)       │   │
│  │ DDM_Client  │◄──►│ - Category browser           │   │
│  │ .psc        │    │ - Item grid with search       │   │
│  └──────┬──────┘    │ - Offset controls            │   │
│         │           │ - Waypoint/path buttons       │   │
│         │ JS bridge └──────────────────────────────┘   │
│         │                                               │
│  ┌──────┴──────┐                                       │
│  │ DDM_Ui.psc  │   Manages CEF ↔ Papyrus messages      │
│  └─────────────┘                                       │
└───────────────────────┬─────────────────────────────────┘
                        │ WebSocket
        ┌───────────────▼───────────────┐
        │     SKYMP SERVER (C++ + TS)   │
        │                               │
        │  ┌─────────────────────────┐  │
        │  │ DDM_Bridge.ts            │  │
        │  │ - Auth validation        │  │
        │  │ - FormID verification    │  │
        │  │ - Broadcast to all       │  │
        │  └─────────────────────────┘  │
        └───────────────────────────────┘
```

### Client (Papyrus)
- **DDM_Client.psc** — Main quest script. Handles spawning, pathing, cleanup, cursor tracking, admin auth, and config loading.
- **DDM_Ui.psc** — Quest script that manages the CEF browser lifecycle and routes JavaScript messages to DDM_Client.

### Server (TypeScript)
- **DDM_Bridge.ts** — A Skymp server plugin that listens for `DIRECTOR_*` chat commands, validates them, and broadcasts structured events to all clients.

### Interface (CEF)
- **zeus.html** — CEF page loaded inside the client
- **zeus.css** — Flat dark theme inspired by Arma 3 Zeus
- **zeus.js** — UI controller, sends actions to Papyrus, receives state updates

---

## Project Structure

```
DungemonDirector/
├── README.md                    # This file
├── INSTALL.md                   # Step-by-step setup
├── CONTRIBUTING.md              # Developer guide
├── plugin.json                  # Skymp plugin manifest
├── config.example.json          # Commented settings template
├── config.schema.json           # JSON Schema for validation
├── scripts/
│   ├── DDM_Client.pex           # Compiled client script
│   └── DDM_Server.pex           # Compiled server script
├── UI/
│   ├── zeus.html                # CEF interface markup
│   ├── zeus.css                 # Arma-inspired dark theme
│   └── zeus.js                  # UI controller
└── server-bridge/
    └── DDM_Bridge.ts            # Reference Skymp server plugin
```

---

## Detailed File Reference

### `plugin.json`

```json
{
  "name": "DungemonDirector",
  "version": "2.0.0",
  "author": "Dungemon",
  "description": "Arma 3 Zeus-style admin director for Skymp",
  "type": "client",
  "entrypoints": {
    "client": ["DDM_Client"],
    "ui": ["DDM_Ui"]
  },
  "permissions": [
    "chat.read",
    "browser.show",
    "browser.hide",
    "forms.spawn",
    "references.crosshair",
    "game.time"
  ],
  "configSchema": "config.schema.json",
  "dependencies": [],
  "compatibility": {
    "skymp": ">=5.0.0",
    "skyrim": "SE"
  }
}
```

This manifest tells the Skymp plugin loader:
- What scripts to start
- What permissions the plugin needs
- Where its config schema lives
- That it has zero external dependencies

### `config.example.json`

```json
{
  "commandPrefix": "/zeus",
  "aliases": ["/dm", "/director"],
  "maxSpawnedObjects": 40,
  "cleanupBatchSize": 4,
  "defaultPathDelay": 1.5,
  "defaultOffsets": {
    "height": 30.0,
    "forward": 120.0,
    "right": 0.0
  },
  "admin": {
    "requireAuth": true,
    "allowlistFormIds": ["0x00123ABC"]
  },
  "ui": {
    "keybindToggle": 220
  }
}
```

**Field descriptions:**

| Key | Type | Default | Purpose |
|---|---|---|---|
| `commandPrefix` | string | `/zeus` | Chat command that opens the director |
| `aliases` | string[] | `[/dm, /director]` | Alternate commands recognized as the same intent |
| `maxSpawnedObjects` | int | `40` | When tracked spawned references exceed this, oldest are deleted |
| `cleanupBatchSize` | int | `4` | How many objects to delete per cleanup operation |
| `defaultPathDelay` | float | `1.5` | Seconds between waypoint advances during pathing |
| `defaultOffsets.height` | float | `30.0` | Vertical (Z) offset applied to all spawns |
| `defaultOffsets.forward` | float | `120.0` | Forward (Y) offset from anchor |
| `defaultOffsets.right` | float | `0.0` | Lateral (X) offset from anchor |
| `admin.requireAuth` | bool | `true` | If false, any player can use the director |
| `admin.allowlistFormIds` | string[] | `[]` | Hex FormIDs of actors permitted to use the director |
| `ui.keybindToggle` | int | `220` | Virtual keycode. 220 = End key on standard keyboards |

Copy `config.example.json` to `config.json` and edit values as needed.

### `config.schema.json`

A JSON Schema document that defines valid configuration keys, types, ranges, and defaults. Used by editors (VS Code, JetBrains) for autocomplete and by the plugin for runtime validation. Refer to the file for full annotations.

---

## Installation

### Requirements

- Skyrim Special Edition (Steam)
- Skymp 5.0.0 or later
- SKSE64 installed and working
- CEF/Chromium support enabled in Skymp (required for the UI panel)
- Windows 10/11 for the PowerShell installer. Linux and Mac are supported via the Bash script.

### Automated Installation (Recommended)

1. Download the latest release ZIP from the project's Releases page.
2. Extract the ZIP into your `Skyrim Special Edition/Data/` directory. The folder structure should look like:
   ```
   Data/Plugins/DungemonDirector/
   ├── plugin.json
   ├── config.schema.json
   ├── config.example.json
   ├── scripts/
   ├── UI/
   └── server-bridge/
   ```
3. Open PowerShell and navigate to the extracted folder, or right-click `install.ps1` and select "Run with PowerShell".
4. Follow the prompts. The installer will:
   - Detect your Skyrim Data directory
   - Copy files to the correct location
   - Create `config.json` from the template
   - Register the plugin in Skymp's configuration
5. Edit `Data/Plugins/DungemonDirector/config.json`. Add your character's FormID to `admin.allowlistFormIds`.
6. Restart your Skymp server.

### Manual Installation

If the automated installer fails:

1. Create `Data/Plugins/DungemonDirector/` in your Skyrim Data directory.
2. Copy `scripts/*.pex` into `Data/Plugins/DungemonDirector/scripts/`.
3. Copy `UI/*` into `Data/Plugins/DungemonDirector/UI/`.
4. Copy `plugin.json`, `config.example.json` (renamed to `config.json`), and `config.schema.json` into `Data/Plugins/DungemonDirector/`.
5. Edit your Skymp plugin configuration (usually `Data/Skymp/plugins.json`) to include:
   ```json
   { "name": "DungemonDirector", "path": "Plugins/DungemonDirector/plugin.json", "enabled": true }
   ```
6. Restart the server.

---

## Usage

### Director Mode UI (CEF panel)

1. Open the Director Mode UI from chat:
   - Type `/zeus` (or `/dm`, depending on your server setup)
2. Use the panel to set:
   - spawn **Offsets** (Height / Forward / Right)
   - waypoint **Pathing** (Add / Start / Pause / Resume / Cancel)
   - **Cleanup** limits to avoid runaway spawns

The UI is implemented in `skymp5-front/src/constructorComponents/chat/index.js` and sends commands that are handled by the Papyrus director script.

### Test Script: `DungemonDirectorQuest.psc` (skymp/test scripts)

This repository also includes a Papyrus test harness script used to validate director behavior end-to-end in Skymp.


#### What it does
- Tracks a director **Actor** (`DirectorActor`) and/or **Anchor** reference (`DirectorMarker`).
- Spawns **actors**, **items**, and **buildings** at the resolved anchor.
- Moves an actor along a list of **waypoint/path points**.
- Tracks spawned references for **cleanup**.
- Implements an admin-gated chat command parser.

#### Properties (relevant)
- `DirectorActor`: the actor to use as the director/possessed actor source.
- `DirectorMarker`: optional marker used as anchor when `AnchorMode == "marker"`.
- `DirectorModeEnabled`: master on/off gate for all director actions.
- `AnchorMode`: one of `"auto"`, `"crosshair"`, `"marker"`.
- Spawn offsets:
  - `DefaultSpawnHeightOffset` (Z)
  - `DefaultSpawnForwardOffset` (forward/Y from anchor)
- Pathing:
  - `DefaultPathDelay` seconds between waypoint steps

#### Chat commands
All commands below require admin privileges (see `RequireAdmin`).

- Help:
  - `/directormode help` or `/dm help`
- Toggle:
  - `/directormode toggle`
- Status:
  - `/directormode showstatus`

Anchor/selection:
- Set anchor mode:
  - `/directormode setanchormode <auto|crosshair|marker>`
- Set marker/actor from crosshair:
  - `/directormode setmarkerfromcrosshair`
  - `/directormode setdirectoractorfromcrosshair`
- Teleport director actor to marker:
  - `/directormode teleportdirectortomarker`

Spawning:
- Spawn by base id:
  - `/directormode spawnactor <baseId> [count]`
  - `/directormode spawnitem <baseId> [count]`
  - `/directormode spawnbuilding <baseId>`
- Spawn from configured default lists (must be wired in the test environment):
  - `/directormode spawnactorlist [count]`
  - `/directormode spawnitemlist [count]`
  - `/directormode spawnbuildinglist`

Pathing:
- Add waypoint from crosshair:
  - `/directormode addpathpointfromcrosshair`
- Start moving:
  - `/directormode startactorpath [delay]` (delay optional; defaults to `DefaultPathDelay`)
- Control path:
  - `/directormode pauseactorpath`
  - `/directormode resumeactorpath`
  - `/directormode cancelactorpath`
  - `/directormode clearpath`

Cleanup:
- Delete oldest spawned objects:
  - `/directormode cleanup [count]` (default `1`)

Spawn offsets:
- Update spawn offsets used by default anchor actor spawns:
  - `/directormode setspawnoffset <height> <forward>`
- Update path default delay:
  - `/directormode setdefaultdelay <delay>`

Objectives (test-only):
- Add objective text:
  - `/directormode objective <text...>`
- List objectives:
  - `/directormode listobjectives`
- Clear objectives:
  - `/directormode clearobjectives`

Note: the test script uses `DirectorModeEnabled` as a hard gate—spawning and pathing won’t run while it’s disabled.

### Starting the Interface


- **Chat:** Type `/zeus` (or an alias like `/dm`)
- **Keybind:** Press `End` by default. Change via `ui.keybindToggle` in config.

### Spawning Objects

1. Ensure Director mode is enabled (status pill shows "ONLINE").
2. Select a category from the left sidebar: **Actors**, **Items**, or **Buildings**.
3. Click an entry in the center grid to select it. Use the search bar to filter.
4. Set the spawn count (1–99) using the number input.
5. Click **SPAWN**.

Objects spawn at the **cursor anchor** — a virtual marker positioned at your crosshair or a configurable offset from your character. The right sidebar shows and lets you adjust height, forward, and right offsets in real time.

### Pathing

1. Position the cursor where you want a waypoint.
2. Click **Add Waypoint**. Repeat for each point in the path.
3. Target an actor (look at it and click **Possess**, or ensure `DirectorActor` is set).
4. Click **Start**. The actor will move to each waypoint with `defaultPathDelay` seconds between moves.
5. Use **Pause** and **Resume** as needed.
6. Click **Cancel** to clear the path and stop movement.

### Teleportation and Possession

- **Teleport:** Moves your player to the cursor position.
- **Possess:** Takes control of the actor your crosshair is aimed at. Press **Unpossess** to return to your original character.
- **Unpossess:** Returns control to your player character.

### Cleanup

The plugin tracks every spawned reference in a first-in, first-out queue. When the queue exceeds `maxSpawnedObjects`, the oldest `cleanupBatchSize` objects are disabled and deleted automatically.

You can also trigger manual cleanup:
- **4** — delete the 4 oldest objects
- **20** — delete the 20 oldest
- **All** — delete everything

### Admin Authentication

When `admin.requireAuth` is `true`, the plugin checks whether the command sender is authorized:

1. It looks up the sender's actor base FormID in `admin.allowlistFormIds` (loaded from `config.json`).
2. If found, the command proceeds.
3. If not found, the plugin sends an error notification and ignores the command.

When `admin.requireAuth` is `false`, all players have access.

---

## Server Bridge: Multiplayer Synchronization

By default, DungemonDirector runs in **local-only mode**. Spawns, paths, and state changes affect only the admin's client. To broadcast changes to all players, install the reference TypeScript server bridge.

### What the Bridge Does

1. Listens for chat commands or network messages prefixed `DIRECTOR_*`.
2. Validates the sender is in the admin allowlist.
3. Verifies requested FormIDs exist and parameters are within bounds.
4. Broadcasts structured events to all connected clients.

### Installing the Bridge

1. Copy `server-bridge/DDM_Bridge.ts` into your Skymp server's `plugins/` directory.
2. Ensure your server loads TypeScript plugins (refer to your Skymp server documentation).
3. Edit the bridge's admin list to match `config.json`'s `allowlistFormIds`.
4. Restart the server.

### Wire Protocol

The client emits the following commands:

```
DIRECTOR_SPAWN:Actor:<formId>:<count>
DIRECTOR_SPAWN:Item:<formId>:<count>
DIRECTOR_SPAWN:Building:<formId>
DIRECTOR_PATH:START:<actorFormId>:<delay>
DIRECTOR_PATH:PAUSE
DIRECTOR_PATH:RESUME
DIRECTOR_PATH:CANCEL
DIRECTOR_PATH:NEXT:<waypointFormId>
```

The bridge should receive these, validate, and broadcast a structured event (e.g., `ZEUS_SPAWN` or `ZEUS_PATH`) to all clients. Client-side Papyrus already executes the local action; the broadcast simply tells other clients to do the same.

---

## Configuration Reference

All runtime settings live in `config.json`. The full schema with validation rules is in `config.schema.json`.

### Quick Reference

| Setting | Key | Type | Default | Effect |
|---|---|---|---|---|
| Command prefix | `commandPrefix` | string | `/zeus` | Chat command to open director |
| Aliases | `aliases` | string[] | `[/dm, /director]` | Alternate accepted commands |
| Spawn cap | `maxSpawnedObjects` | int | `40` | Auto-cleanup threshold |
| Cleanup size | `cleanupBatchSize` | int | `4` | Objects removed per cleanup |
| Path delay | `defaultPathDelay` | float | `1.5` | Seconds between waypoints |
| Height offset | `defaultOffsets.height` | float | `30.0` | Vertical spawn offset |
| Forward offset | `defaultOffsets.forward` | float | `120.0` | Forward spawn offset |
| Right offset | `defaultOffsets.right` | float | `0.0` | Rightward spawn offset |
| Require auth | `admin.requireAuth` | bool | `true` | Enforce admin allowlist |
| Admin list | `admin.allowlistFormIds` | string[] | `[]` | Allowed actor hex FormIDs |
| Toggle key | `ui.keybindToggle` | int | `220` | Virtual keycode (End) |

### Finding FormIDs

To populate `admin.allowlistFormIds`:
1. Load Skyrim with your character.
2. Open the console (`~` key).
3. Click your character. The console displays `<>` with a hex FormID.
4. Copy that hex string (e.g., `0x0012ABC4`) into the config array.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Director commands require admin privileges" | Your FormID is not in `allowlistFormIds` | Add your hex FormID to `admin.allowlistFormIds` in `config.json` and restart |
| "No anchor available for spawn" | Crosshair is not pointing at a valid surface | Aim at the ground or a static object; ensure `anchorMode` is correct |
| UI does not appear | CEF is disabled or `skyrimPlatform.browser.show` is unavailable | Enable Chromium/CEF in Skymp settings; check Papyrus log for errors |
| "Form not found" | FormID is incorrect or the mod providing it is not loaded | Verify the hex FormID; ensure the mod is in both client and server load orders |
| Other players cannot see spawns | No server bridge installed | Install `DDM_Bridge.ts` on the server; verify network messages are being broadcast |
| Script fails to load | Missing `.pex` file or wrong path | Verify `scripts/DDM_Client.pex` and `DDM_Server.pex` exist in `Data/Plugins/DungemonDirector/scripts/` |
| Pathing actor teleports instead of walking | Server is not broadcasting path updates | Ensure bridge is running; path sync requires server-side relay |

---

## Contributing

Contributions are welcome. To submit changes:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-change`.
3. Make your changes to the Papyrus source (`.psc`) or UI (`UI/*.html`, `UI/*.css`, `UI/*.js`).
4. Compile `.psc` files using the Papyrus compiler against Skymp definitions.
5. Test on a local server with at least two clients.
6. Submit a pull request with a clear description:
   - What changed and why
   - How to test it
   - Whether it affects the config schema, UI, or wire protocol

### Code Standards

- **Papyrus:** Null-check all inputs. Return early. Use `Notify` for user-facing messages. Do not reference `ObjectReferenceEx`, `M.`, or `StringUtilEx`.
- **UI (HTML/CSS/JS):** Maintain the flat, no-shadow, no-rounded-corner aesthetic. Do not introduce gradients or blur effects. Keep the three-column layout.
- **TypeScript:** Follow the existing bridge pattern. Do not introduce new dependencies.
- **Documentation:** Update `README.md` and `config.schema.json` when adding or changing settings.

---

## License

```
MIT License

Copyright (c) 2026 DungemonDirector Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Summary

DungemonDirector is a self-contained, zero-dependency Skymp plugin that adds a professional-grade director interface to Skyrim Special Edition. It installs in one command, configures through a single JSON file, and operates without requiring any other mod or framework. The Arma 3 Zeus aesthetic is used only as a visual reference; no external assets, proprietary systems, or third-party frameworks are required.
