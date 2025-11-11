import { PayloadAction, createSlice, nanoid } from '@reduxjs/toolkit';
import type { RetrievedChunk } from '../types/api';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  context?: RetrievedChunk[];
  avgSimilarity?: number | null;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
}

const STORAGE_KEY = 'chat_sessions_v1';

const truncateTitle = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) {
    return 'Untitled session';
  }
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed;
};

const createSession = (title?: string): ChatSession => {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    title: title ?? 'New session',
    createdAt: now,
    updatedAt: now,
    messages: []
  };
};

const sanitizeState = (state: ChatState | undefined): ChatState | undefined => {
  if (!state || !Array.isArray(state.sessions)) {
    return undefined;
  }
  const sessions = state.sessions.filter((session) => Array.isArray(session.messages));
  if (sessions.length === 0) {
    return undefined;
  }
  sessions.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const currentSessionId = sessions.some((session) => session.id === state.currentSessionId)
    ? state.currentSessionId
    : sessions[0].id;
  return { sessions, currentSessionId };
};

export const loadChatState = (): ChatState | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as ChatState;
    return sanitizeState(parsed);
  } catch (error) {
    console.warn('Failed to load chat sessions from storage', error);
    return undefined;
  }
};

export const persistChatState = (state: ChatState): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to persist chat sessions', error);
  }
};

const fallbackState = (): ChatState => {
  const session = createSession();
  return { sessions: [session], currentSessionId: session.id };
};

const initialState: ChatState = loadChatState() ?? fallbackState();

interface AddMessagePayload {
  sessionId: string;
  message: ChatMessage;
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    startSession: (state) => {
      const sessionIndex = state.sessions.length + 1;
      const session = createSession(`Session ${sessionIndex}`);
      state.sessions = [session, ...state.sessions];
      state.currentSessionId = session.id;
    },
    switchSession: (state, action: PayloadAction<string>) => {
      const targetId = action.payload;
      if (state.sessions.some((session) => session.id === targetId)) {
        state.currentSessionId = targetId;
      }
    },
    addMessage: (state, action: PayloadAction<AddMessagePayload>) => {
      const { sessionId, message } = action.payload;
      const session = state.sessions.find((item) => item.id === sessionId);
      if (!session) {
        return;
      }
      session.messages.push(message);
      session.updatedAt = message.timestamp;
      if (message.role === 'user' && session.messages.filter((m) => m.role === 'user').length === 1) {
        session.title = truncateTitle(message.content);
      }
      state.sessions.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    }
  }
});

export const { startSession, switchSession, addMessage } = chatSlice.actions;

export default chatSlice.reducer;
