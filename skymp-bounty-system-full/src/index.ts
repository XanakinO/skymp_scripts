import { Debug, on, once, Ui, Game, Input, HttpClient } from "skyrimPlatform";

interface Bounty {
  id: string;
  targetId: number;
  placerId: number;
  amount: number;
  reason: string;
  timestamp: number;
  claimedBy?: number;
}

let currentBounties: Bounty[] = [];
let isWanted = false;

once("update", () => {
  Debug.notification("Bounty Hunting System v1.0 Loaded - Press F10 for Bounty Board");
});

on("update", () => {
  // Periodic sync or visual effects for wanted players could go here
});

Input.on("keydown", (e: any) => {
  if (e.keyCode === 0x79) { // F10
    openBountyBoard();
  }
});

function openBountyBoard() {
  Ui.showBrowser(true, "bountyBoard.html");
}

// Called from UI
export function placeBounty(targetId: number, amount: number, reason: string) {
  HttpClient.postJson("/custom/placeBounty", { targetId, amount, reason })
    .then(() => Debug.notification("Bounty placed successfully!"))
    .catch(() => Debug.notification("Failed to place bounty"));
}

export function claimBounty(bountyId: string) {
  HttpClient.postJson("/custom/claimBounty", { bountyId });
}

// Server will send events to update UI
on("customEvent", (event: any) => {
  if (event.name === "updateBounties") {
    currentBounties = event.data;
    // Refresh UI if open
  }
  if (event.name === "setWanted") {
    isWanted = event.data;
    if (isWanted) {
      Debug.notification("You have been marked as WANTED!");
    }
  }
});
