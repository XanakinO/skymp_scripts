import { Debug, on, once, Game, Ui, Input, HttpClient, Actor, VisualEffect } from 'skyrimPlatform';

let isInAfterlife = false;

once('update', () => {
  Debug.notification("Death & Afterlife System Loaded - Haunting & Soul Gems enabled");
});

on('deathEnd', (actor: Actor) => {
  if (actor.isPlayer()) {
    enterAfterlife(actor);
  }
});

function enterAfterlife(player: Actor) {
  isInAfterlife = true;
  const afterlifeCellId = 0x00000000; // Replace with your custom cell FormID
  player.setPosition(0, 0, 0);
  Debug.notification("You have entered the Afterlife...");

  // Visual ghost effect
  applyGhostVisualEffect(player);

  Ui.showBrowser(true, "afterlifeUI.html");
}

function applyGhostVisualEffect(player: Actor) {
  // Apply transparent shader / ghost visual (use SKSE-compatible or SkyrimPlatform visual effects)
  VisualEffect.apply(player, "ghostEffect"); // Placeholder - replace with actual effect ID or script call
  Debug.notification("You appear as a translucent ghost...");
}

Input.on("keydown", (e) => {
  if (e.keyCode === 0x7B && isInAfterlife) { // F12
    Ui.showBrowser(true, "afterlifeUI.html");
  }
});

// New: Haunting
export function startHaunting(targetPlayerId: number) {
  HttpClient.postJson("/custom/startHaunting", { targetId: targetPlayerId });
}

// Soul gem binding (from living player side)
export function bindSoulToGem(ghostId: number) {
  HttpClient.postJson("/custom/bindSoulGem", { ghostId });
}

export function performRevivalRitual(targetPlayerId: number) {
  HttpClient.postJson("/custom/revivePlayer", { targetId: targetPlayerId });
}
