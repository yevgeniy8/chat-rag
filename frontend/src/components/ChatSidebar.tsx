import React from 'react';
import { startSession, switchSession } from '../store/chatSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

const ChatSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector((state) => state.chat.sessions);
  const currentSessionId = useAppSelector((state) => state.chat.currentSessionId);

  const handleCreateSession = () => {
    dispatch(startSession());
  };

  return (
    <aside className="flex h-full w-72 flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700">Sessions</h2>
        <button
          onClick={handleCreateSession}
          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-blue-700"
        >
          New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">No sessions yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 text-sm">
            {sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const timestamp = new Date(session.updatedAt).toLocaleString();
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => dispatch(switchSession(session.id))}
                    className={`flex w-full flex-col items-start px-4 py-3 text-left transition ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-medium">{session.title}</span>
                    <span className="mt-1 text-xs text-gray-500">{timestamp}</span>
                    <span className="mt-1 text-xs text-gray-400">
                      {session.messages.length} message{session.messages.length === 1 ? '' : 's'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default ChatSidebar;
