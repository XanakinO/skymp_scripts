import { configureStore } from '@reduxjs/toolkit';
import directorReducer from './directorSlice';

export const store = configureStore({
  reducer: {
    director: directorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;