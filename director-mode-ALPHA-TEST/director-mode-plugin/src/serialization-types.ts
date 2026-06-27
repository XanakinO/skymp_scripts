/**
 * SkyMP Director Mode - Serialization Type Definitions
 * Optimized for network transmission and savegame compatibility.
 */

export interface Position {
  x: number;
  y: number;
  z: number;
  angle?: number;
}

export interface SerializedForm {
  formId: number;
  baseId?: number;
  pluginName?: string;
}

export interface SerializedActor extends SerializedForm {
  position: Position;
  health?: number;
  aiPackage?: string;
  aggression?: number;
  faction?: string;
}

export interface SerializedSpawnData {
  type: 'npc' | 'creature' | 'object' | 'item';
  baseForm: SerializedForm;
  position: Position;
  count?: number;
  level?: number;
  aiSettings?: {
    package: string;
    aggression: number;
    confidence: number;
  };
  eventContext?: string;
}

export interface SerializedDirectorEvent {
  id: string;
  type: string;
  name: string;
  location: string;
  startedAt: number;
  participants: number;
  state: 'active' | 'paused' | 'completed' | 'scheduled';
  serializedSpawns?: SerializedActor[];
}

export interface SerializedMultipliers {
  npcDamage: number;
  npcHealth: number;
  respawnRate: number;
}

export interface SerializedQuestUpdate {
  questId: number;
  stage?: number;
  objectiveId?: number;
  completed?: boolean;
}

export interface SerializedAnnouncement {
  message: string;
  sender: string;
  timestamp: number;
}

export interface DirectorNetworkMessage {
  type: string;
  payload: any;
  timestamp: number;
  senderId?: number;
}

// Helpers (JSON for now - can be replaced with BitStream)
export function serialize<T>(data: T): string {
  return JSON.stringify(data);
}

export function deserialize<T>(str: string): T {
  return JSON.parse(str);
}
