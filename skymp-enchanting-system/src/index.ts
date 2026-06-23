import { Debug, on, once, Game, Input, Ui, HttpClient } from 'skyrimPlatform';

Debug.notification("Custom Enchanting & Artifact System Loaded");

let isEnchanter = false; // Set based on player skill/perk

once('update', () => {
  // Client initialization
});

on('equip', (actor, item) => {
  // Example: Detect artifact equipping
  if (isEnchanter) {
    Debug.notification("Artifact power activated");
  }
});

// Hotkey to open Enchanting UI (F9)
Input.on("keydown", (e) => {
  if (e.keyCode === 0x78) { // F9
    openEnchantingUI();
  }
});

function openEnchantingUI() {
  Ui.showBrowser(true, "enchantingUI.html");
}

// Call server for crafting
export function craftArtifact(baseItemId: number, soulGemId: number, effectId: string, isRitual: boolean = false, participants: number[] = []) {
  HttpClient.postJson("/custom/craftArtifact", {
    baseItemId,
    soulGemId,
    effectId,
    isRitual,
    participants
  }).then(response => {
    Debug.notification(isRitual ? "Grand Ritual completed! Legendary artifact forged." : "Artifact crafted successfully!");
  });
}

// Ritual participation
export function joinRitual(ritualId: string) {
  HttpClient.postJson("/custom/joinRitual", { ritualId });
}