import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DirectorState {
  activeEvent: any | null;
  events: any[];
  logs: string[];
  globalMultipliers: {
    npcDamage: number;
    npcHealth: number;
    respawnRate: number;
  };
  spawnSearch: string;
}

const initialState: DirectorState = {
  activeEvent: null,
  events: [],
  logs: [],
  globalMultipliers: {
    npcDamage: 1.0,
    npcHealth: 1.0,
    respawnRate: 1.0,
  },
  spawnSearch: '',
};

const directorSlice = createSlice({
  name: 'director',
  initialState,
  reducers: {
    setActiveEvent: (state, action: PayloadAction<any>) => {
      state.activeEvent = action.payload;
    },
    addLog: (state, action: PayloadAction<string>) => {
      state.logs.unshift(action.payload);
      if (state.logs.length > 50) state.logs.pop();
    },
    updateMultipliers: (state, action: PayloadAction<Partial<DirectorState['globalMultipliers']>>) => {
      state.globalMultipliers = { ...state.globalMultipliers, ...action.payload };
    },
    setSpawnSearch: (state, action: PayloadAction<string>) => {
      state.spawnSearch = action.payload;
    },
    // Add more actions as needed
  },
});

export const { setActiveEvent, addLog, updateMultipliers, setSpawnSearch } = directorSlice.actions;
export default directorSlice.reducer;