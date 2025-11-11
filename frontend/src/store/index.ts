import { configureStore } from '@reduxjs/toolkit';
import chatReducer, { persistChatState } from './chatSlice';
import filesReducer from './filesSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    files: filesReducer
  }
});

store.subscribe(() => {
  const state = store.getState();
  persistChatState(state.chat);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
