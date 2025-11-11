import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatDualResponse, ChatSession, ChatSessionMessage } from '../types/api';

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentComparison: ChatDualResponse | null;
}

const STORAGE_KEY = 'chat_sessions_v2';

const sortSessions = (sessions: ChatSession[]): ChatSession[] => {
  return sessions.slice().sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
};

const buildComparisonFromSession = (session: ChatSession | undefined): ChatDualResponse | null => {
  if (!session || session.messages.length === 0) {
    return null;
  }
  const lastMessage = session.messages[session.messages.length - 1];
  return {
    session_id: session.session_id,
    prompt: lastMessage.prompt,
    timestamp: lastMessage.timestamp,
    baseline: lastMessage.baseline,
    rag: lastMessage.rag,
    metrics: session.metrics
  };
};

const sanitizeState = (state: ChatState | undefined): ChatState | undefined => {
  if (!state || !Array.isArray(state.sessions)) {
    return undefined;
  }
  const validSessions = state.sessions.filter((session) => Array.isArray(session.messages));
  if (validSessions.length === 0) {
    return { sessions: [], currentSessionId: null, currentComparison: null };
  }
  const sorted = sortSessions(validSessions);
  const currentSessionId = sorted.some((session) => session.session_id === state.currentSessionId)
    ? state.currentSessionId
    : sorted[0].session_id;
  const activeSession = sorted.find((session) => session.session_id === currentSessionId);
  const comparison = state.currentComparison ?? buildComparisonFromSession(activeSession);
  return {
    sessions: sorted,
    currentSessionId,
    currentComparison: comparison ?? null
  };
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

const initialState: ChatState = loadChatState() ?? {
  sessions: [],
  currentSessionId: null,
  currentComparison: null
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<ChatSession[]>) => {
      const sessions = sortSessions(action.payload);
      state.sessions = sessions;
      if (sessions.length === 0) {
        state.currentSessionId = null;
        state.currentComparison = null;
        return;
      }
      const currentId = state.currentSessionId;
      const active = sessions.find((session) => session.session_id === currentId) ?? sessions[0];
      state.currentSessionId = active.session_id;
      state.currentComparison = buildComparisonFromSession(active);
    },
    setCurrentSession: (state, action: PayloadAction<string | null>) => {
      state.currentSessionId = action.payload;
      const active = state.sessions.find((session) => session.session_id === action.payload);
      state.currentComparison = buildComparisonFromSession(active);
    },
    applyComparisonResult: (state, action: PayloadAction<ChatDualResponse>) => {
      const result = action.payload;
      const message: ChatSessionMessage = {
        prompt: result.prompt,
        timestamp: result.timestamp,
        baseline: result.baseline,
        rag: result.rag
      };
      const existing = state.sessions.find((session) => session.session_id === result.session_id);
      if (existing) {
        existing.messages = [...existing.messages, message];
        existing.updated_at = result.metrics.updated_at;
        existing.metrics = result.metrics;
      } else {
        const newSession: ChatSession = {
          session_id: result.session_id,
          created_at: result.metrics.created_at,
          updated_at: result.metrics.updated_at,
          messages: [message],
          metrics: result.metrics
        };
        state.sessions = [newSession, ...state.sessions];
      }
      state.sessions = sortSessions(state.sessions);
      state.currentSessionId = result.session_id;
      state.currentComparison = result;
    },
    deleteSession: (state, action: PayloadAction<string>) => {
      const targetId = action.payload;
      state.sessions = state.sessions.filter((session) => session.session_id !== targetId);
      if (state.currentSessionId === targetId) {
        if (state.sessions.length === 0) {
          state.currentSessionId = null;
          state.currentComparison = null;
        } else {
          state.currentSessionId = state.sessions[0].session_id;
          state.currentComparison = buildComparisonFromSession(state.sessions[0]);
        }
      } else if (state.currentComparison && state.currentComparison.session_id === targetId) {
        state.currentComparison = null;
      }
    },
    clearAllSessions: (state) => {
      state.sessions = [];
      state.currentSessionId = null;
      state.currentComparison = null;
    }
  }
});

export const { setSessions, setCurrentSession, applyComparisonResult, deleteSession, clearAllSessions } =
  chatSlice.actions;

export default chatSlice.reducer;
