import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { deleteAllSessions, deleteSession, getSessions, sendChatMessage } from '../api/chat';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  applyComparisonResult,
  clearAllSessions,
  deleteSession as deleteSessionFromStore,
  setCurrentSession,
  setSessions
} from '../store/chatSlice';

const topKOptions = [3, 5, 8];

const CompareTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sessions, currentSessionId, currentComparison } = useAppSelector((state) => state.chat);
  const [message, setMessage] = useState('');
  const [topK, setTopK] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoadingSessions(true);
      try {
        const data = await getSessions();
        dispatch(setSessions(data));
        setSessionError(null);
      } catch (error) {
        setSessionError('Unable to load sessions. Confirm the backend is running.');
      } finally {
        setIsLoadingSessions(false);
      }
    };

    loadSessions();
  }, [dispatch]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setFormError('Enter a message to compare baseline and RAG responses.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    setStatusMessage(null);

    try {
      const response = await sendChatMessage({
        message: trimmed,
        top_k: topK,
        session_id: currentSessionId ?? undefined
      });
      dispatch(applyComparisonResult(response));
      setStatusMessage('Comparison updated successfully.');
      setMessage('');
    } catch (error) {
      setFormError('Failed to run comparison. Please verify backend availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    dispatch(setCurrentSession(sessionId));
    setStatusMessage(`Restored session ${sessionId.slice(0, 8)}…`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Delete this session and its metrics?')) {
      return;
    }
    setDeletingSessionId(sessionId);
    try {
      await deleteSession(sessionId);
      dispatch(deleteSessionFromStore(sessionId));
      setStatusMessage('Session deleted.');
    } catch (error) {
      setFormError('Unable to delete session. Try again.');
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete all saved sessions? This cannot be undone.')) {
      return;
    }
    setDeletingAll(true);
    try {
      await deleteAllSessions();
      dispatch(clearAllSessions());
      setStatusMessage('All sessions removed.');
    } catch (error) {
      setFormError('Unable to delete all sessions.');
    } finally {
      setDeletingAll(false);
    }
  };

  const historyRows = useMemo(() => {
    return sessions.map((session) => {
      const similarity = Number.isFinite(session.metrics.semantic_similarity)
        ? session.metrics.semantic_similarity.toFixed(2)
        : '—';
      return {
        session,
        similarity
      };
    });
  }, [sessions]);

  const activeTimestamp = currentComparison ? new Date(currentComparison.timestamp).toLocaleString() : null;
  const baselineLatency = currentComparison?.metrics.baseline_latency ?? null;
  const ragLatency = currentComparison?.metrics.rag_latency ?? null;
  const ragSimilarity = currentComparison?.metrics.semantic_similarity ?? null;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:w-72">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Sessions</h3>
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={deletingAll || sessions.length === 0}
            className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:text-red-300"
          >
            {deletingAll ? 'Clearing…' : 'Delete All'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">Each run is stored with latency and similarity metrics.</p>
        {sessionError && <p className="mt-3 text-xs text-red-500">{sessionError}</p>}
        <div className="mt-3 max-h-[420px] overflow-y-auto pr-1 text-sm">
          {isLoadingSessions ? (
            <p className="text-gray-500">Loading sessions…</p>
          ) : sessions.length === 0 ? (
            <p className="text-gray-500">No sessions yet. Run a comparison to create one.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((session) => {
                const isActive = session.session_id === currentSessionId;
                return (
                  <li key={session.session_id}>
                    <button
                      type="button"
                      onClick={() => handleSelectSession(session.session_id)}
                      className={`w-full rounded-md border px-3 py-2 text-left transition ${
                        isActive
                          ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                        <span className="font-semibold">{session.session_id.slice(0, 8)}…</span>
                        <span>{new Date(session.updated_at).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {session.messages.length} interaction{session.messages.length === 1 ? '' : 's'}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <div className="flex-1 space-y-6">
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="chat-message">
                Ask something to compare
              </label>
              <textarea
                id="chat-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                className="mt-2 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Summarise the latest research findings from our dataset"
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label className="font-semibold text-gray-700" htmlFor="top-k">
                Top-k retrieval
              </label>
              <select
                id="top-k"
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {topKOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSubmitting ? 'Comparing…' : 'Run comparison'}
              </button>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {formError ? <span className="text-red-500">{formError}</span> : <span>Latency and semantic similarity update after each run.</span>}
          </div>
          {statusMessage && !formError && (
            <p className="mt-2 text-xs text-emerald-600">{statusMessage}</p>
          )}
        </form>

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
                <span className="font-semibold">Baseline</span>
                {baselineLatency !== null && <span>{baselineLatency} ms</span>}
              </div>
              <div className="mt-3 flex-1 text-sm text-gray-800">
                {currentComparison ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none">
                    {currentComparison.baseline.message}
                  </ReactMarkdown>
                ) : (
                  <p className="text-gray-500">Run a comparison to see the baseline answer.</p>
                )}
              </div>
              <div className="mt-4 border-t border-gray-200 pt-2 text-xs text-gray-500">
                {activeTimestamp ? `Updated ${activeTimestamp}` : 'No timestamp available yet.'}
              </div>
            </div>
            <div className="flex h-full flex-col rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-blue-700">
                <span className="font-semibold">RAG</span>
                <div className="flex items-center gap-2">
                  {ragLatency !== null && <span>{ragLatency} ms</span>}
                  {ragSimilarity !== null && (
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      Similarity {ragSimilarity.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex-1 text-sm text-blue-900">
                {currentComparison ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none text-blue-900">
                    {currentComparison.rag.message}
                  </ReactMarkdown>
                ) : (
                  <p className="text-blue-700">Run a comparison to see the retrieval-augmented answer.</p>
                )}
              </div>
              <div className="mt-4 border-t border-blue-200 pt-2 text-xs text-blue-700">
                {activeTimestamp ? `Updated ${activeTimestamp}` : 'No timestamp available yet.'}
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">History</h3>
            <span className="text-xs text-gray-400">{sessions.length} session{sessions.length === 1 ? '' : 's'}</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Session</th>
                  <th className="px-3 py-2">Baseline Latency</th>
                  <th className="px-3 py-2">RAG Latency</th>
                  <th className="px-3 py-2">Similarity</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">
                      No history available yet. Run a comparison to populate this table.
                    </td>
                  </tr>
                ) : (
                  historyRows.map(({ session, similarity }) => (
                    <tr
                      key={session.session_id}
                      className={`cursor-pointer transition hover:bg-blue-50 ${
                        session.session_id === currentSessionId ? 'bg-blue-50' : 'bg-white'
                      }`}
                      onClick={() => handleSelectSession(session.session_id)}
                    >
                      <td className="px-3 py-2 font-medium text-gray-800">{session.session_id.slice(0, 8)}…</td>
                      <td className="px-3 py-2 text-gray-600">{session.metrics.baseline_latency} ms</td>
                      <td className="px-3 py-2 text-gray-600">{session.metrics.rag_latency} ms</td>
                      <td className="px-3 py-2 text-gray-600">{similarity}</td>
                      <td className="px-3 py-2 text-gray-600">{new Date(session.updated_at).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteSession(session.session_id);
                          }}
                          disabled={deletingSessionId === session.session_id}
                          className="text-lg"
                          aria-label="Delete session"
                        >
                          {deletingSessionId === session.session_id ? '…' : '🗑️'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CompareTab;
