import { on, printConsole, Browser, HttpClient } from "skyrimPlatform";

// Director Mode Client Plugin
// Toggles the CEF dashboard and communicates with server

let directorBrowser: any = null;

on("update", () => {
  // Hotkey: Press Insert to toggle Director Mode (admin only)
  if (skyrimPlatform.input.isKeyPressed(0xC9)) { // Insert key
    toggleDirectorUI();
  }
});

function toggleDirectorUI() {
  if (directorBrowser) {
    directorBrowser.destroy();
    directorBrowser = null;
    printConsole("Director Mode UI closed");
    return;
  }

  // Create CEF browser for the dashboard
  // For live-reload dev: use http://localhost:3000 (React dev server)
  // For production: use file:///Data/Platform/UI/director/index.html
  directorBrowser = new Browser("http://localhost:3000", {
    width: 1920,
    height: 1080,
    show: true
  });

  // Bind events
  directorBrowser.on("message", (event: any) => {
    const { type, data } = event;
    if (type === "startEvent") {
      skyrimPlatform.emitServerEvent("directorStartEvent", data);
    } else if (type === "spawnNpc") {
      skyrimPlatform.emitServerEvent("directorSpawnNpc", data);
    } else if (type === "setMultipliers") {
      skyrimPlatform.emitServerEvent("directorSetMultipliers", data);
    } else if (type === "setTime" || type === "setWeather") {
      skyrimPlatform.emitServerEvent(`director${type.charAt(0).toUpperCase() + type.slice(1)}`, data);
    } else if (type === "sendAnnouncement") {
      skyrimPlatform.emitServerEvent("directorAnnouncement", data);
    } else if (type === "setNpcAi") {
      skyrimPlatform.emitServerEvent("directorSetNpcAi", data);
    } else if (type === "startQuest" || type === "updateQuestObjective" || type === "completeQuest") {
      skyrimPlatform.emitServerEvent(`director${type.charAt(0).toUpperCase() + type.slice(1)}`, data);
    } else if (type === "stopAllAi") {
      skyrimPlatform.emitServerEvent("directorStopAllAi", data);
    } else if (type === "directorGetPlayerPosition") {
      // Get current player position via SkyrimPlatform
      const player = Game.getPlayer();
      if (player) {
        const pos = {
          x: player.getPositionX(),
          y: player.getPositionY(),
          z: player.getPositionZ()
        };
        // Send back to UI via CEF
        directorBrowser.executeJavaScript(`window.updatePlayerPosition && window.updatePlayerPosition(${JSON.stringify(pos)});`);
        printConsole(`Sent player position to UI: ${JSON.stringify(pos)}`);
      }
    } else if (type === "directorSpawnAtPosition") {
      // Enhanced spawn with position
      skyrimPlatform.emitServerEvent("directorSpawnNpc", data);
    }
    // Add more handlers as needed
  });

  printConsole("Director Mode UI opened");

  // === LIVE SERVER → UI SYNC (Critical for no placeholders) ===
  const forwardToUI = (eventType: string, data: any) => {
    if (directorBrowser) {
      const js = `window.handleServerEvent && window.handleServerEvent({ type: "${eventType}", data: ${JSON.stringify(data)} });`;
      directorBrowser.executeJavaScript(js);
    }
  };

  skyrimPlatform.on("directorEventStarted", (data: any) => forwardToUI("directorEventStarted", data));
  skyrimPlatform.on("directorEventEnded", (data: any) => forwardToUI("directorEventEnded", data));
  skyrimPlatform.on("directorEventPaused", (data: any) => forwardToUI("directorEventPaused", data));
  skyrimPlatform.on("directorEventResumed", (data: any) => forwardToUI("directorEventResumed", data));
  skyrimPlatform.on("directorLog", (data: any) => forwardToUI("directorLog", data));
  skyrimPlatform.on("directorMultipliersUpdated", (data: any) => forwardToUI("directorMultipliersUpdated", data));
  skyrimPlatform.on("directorNpcSpawned", (data: any) => forwardToUI("directorNpcSpawned", data));

  // Player count / server stats (extend as needed)
  skyrimPlatform.on("playerJoin", (playerId: number) => {
    forwardToUI("playerJoin", { playerId, online: 42 }); // Replace with real count from skymp
  });
}

// For production: load local UI file via CEF
printConsole("Director Mode plugin loaded - Press Insert to toggle dashboard");
