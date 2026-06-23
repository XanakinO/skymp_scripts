import { Debug, on, once, Ui, Game, Input, HttpClient, Actor, Form } from 'skyrimPlatform';

let isInTerritory = false;
let currentTerritoryOwner: number | null = null;

once('update', () => {
  Debug.notification("Territory Control System Loaded - Press F11 for Management");
});

Input.on("keydown", (e) => {
  if (e.keyCode === 0x7A) { // F11
    openTerritoryUI();
  }
});

function openTerritoryUI() {
  Ui.showBrowser(true, "territoryUI.html");
}

// Client-side claim attempt
export function attemptClaimTerritory() {
  const player = Game.getPlayer();
  if (!player) return;
  HttpClient.postJson("/custom/claimTerritory", { playerId: player.getFormId() });
}

// Server will sync ownership
on("update", () => {
  // Check player position against territories (simplified)
});
