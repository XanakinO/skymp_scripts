# Director Mode UI Operations (zeus / DungemonDirector)

This page documents how to operate the **Director Mode UI** that is implemented via the CEF (Chromium Embedded Framework) panel.

> Note: The repository also contains a Papyrus test harness script at `skymp/test scripts/DungemonDirectorQuest.psc`. That script is useful for validating the *director behaviors* (spawn/path/cleanup), while this document is about operating the *UI*.

---

## Prerequisites

- The Skymp client must be able to load the CEF browser UI.
- The Director Mode plugin must be enabled on the server and client (depending on your deployment model).

If the UI doesn’t show up, check:
- Skymp CEF browser permissions / platform configuration
- Papyrus log for script load errors
- Any required server-side bridge (if you expect synchronized behavior)

---

## Opening the UI

### Chat command
- `/zeus`

### Aliases
Depending on configuration, the director may also accept:
- `/dm`
- `/director`

### Keybind
- Default keybind is typically the **End** key.
- If you can’t remember it, look up the keybind in your plugin config.

---

## UI Layout (quick orientation)

The director UI is inspired by **Arma 3 Zeus** and is laid out in three primary columns:

1. **Left column** — Category & selection
   - Actors
   - Items
   - Buildings
2. **Center column** — Search + grid of selectable entities
   - Click a result to select it
   - Adjust spawn count
   - Click **SPAWN**
3. **Right column** — Controls & offsets
   - Spawn offsets (height / forward / right)
   - Path/waypoint controls

---

## Spawning Actors / Items / Buildings

1. Open the director UI.
2. Choose a category in the left column:
   - **Actors**
   - **Items**
   - **Buildings**
3. Use the search box to locate what you want.
4. Click an entity in the center grid to select it.
5. Set **count** (number of objects to spawn).
6. (Optional) Adjust offsets in the right column:
   - **Height (Z)**
   - **Forward (Y)**
   - **Right (X)**
7. Click **SPAWN**.

### Where spawns appear
Spawns are placed at the current **anchor** (cursor/crosshair marker or marker reference depending on configuration). Offsets are applied relative to that anchor.

---

## Waypoint Pathing (Move NPCs along points)

Use these controls to move an actor across a series of points.

### Add waypoints
1. Aim/cursor over the first spot.
2. Click **Add Waypoint**.
3. Repeat for additional points.

### Start pathing
1. Select/target the actor you want to move.
2. Click **Start**.
3. The actor advances to each waypoint, waiting `defaultPathDelay` between steps.

### Control
- **Pause**: stops advancing to the next waypoint.
- **Resume**: continues advancing.
- **Cancel**: stops pathing and clears the current path (depending on configuration).

---

## Anchor & Placement Mode (if available)

Some configurations allow switching how the anchor point is resolved:
- Auto (server/client chooses)
- Crosshair anchored
- Marker anchored

If your UI exposes this toggle, pick the one that matches your workflow.

---

## Cleanup

When spawning many objects, the director tracks spawned references. Cleanup prevents runaway object counts.

- Auto cleanup triggers when tracked objects exceed `maxSpawnedObjects`.
- Manual cleanup deletes the oldest objects first, in batches of `cleanupBatchSize`.

UI usually offers:
- Cleanup (single batch)
- Cleanup (all)

---

## Troubleshooting

### Live status looks wrong

The UI’s telemetry readout updates after you click an action (and/or if “Auto showstatus after actions” is enabled).

If you want a refresh at any time:
- Click **Status** in the Director panel
- Or manually run in chat: `/directormode showstatus`

### Spawn safety

Spawning is clamped in the UI via a safety limit.
- Default safe cap is **40** spawn count.
- When your spawn count exceeds the cap, spawn buttons are disabled.

### UI won’t open

- Verify plugin is enabled.
- Verify CEF runtime is available.

### Spawns don’t happen

- Director mode may be disabled.
- If admin auth is enabled, the current player may not be authorized.

### Other players can’t see spawns

- You likely need a server-side bridge to broadcast director events.

---


