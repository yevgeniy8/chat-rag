/**
 * Thesis Context: Chat UI orchestrates controlled interactions, capturing paired prompts under RAG-on and
 * RAG-off conditions so evaluators can measure retrieval impact while observing surfaced evidence.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from '@reduxjs/toolkit';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendMessage } from '../api/chat';
import RagToggle from './RagToggle';
import RetrievedContext from './RetrievedContext';
import { ChatResponse, RetrievedChunk } from '../types/api';
import { addMessage } from '../store/chatSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

const ChatUI: React.FC = () => {
  const dispatch = useAppDispatch();
  const { session, sessionId } = useAppSelector((state) => {
    const currentId = state.chat.currentSessionId;
    const activeSession = state.chat.sessions.find((item) => item.id === currentId) ?? null;
    return { session: activeSession, sessionId: currentId };
  });

  const messages = session?.messages ?? [];
  const [input, setInput] = useState('');
  const [useRag, setUseRag] = useState(true);
  const [topK, setTopK] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrievedChunks, setRetrievedChunks] = useState<RetrievedChunk[]>([]);
  const [avgSimilarity, setAvgSimilarity] = useState<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!session) {
      setRetrievedChunks([]);
      setAvgSimilarity(null);
      return;
    }
    const lastAssistant = [...session.messages].reverse().find((message) => message.role === 'assistant');
    if (!useRag) {
      setRetrievedChunks([]);
      setAvgSimilarity(null);
      return;
    }
    setRetrievedChunks(lastAssistant?.context ?? []);
    setAvgSimilarity(lastAssistant?.avgSimilarity ?? null);
  }, [session, useRag]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length, isLoading]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!sessionId || !input.trim() || isLoading) {
        return;
      }

      const userMessage = {
        id: nanoid(),
        role: 'user' as const,
        content: input.trim(),
        timestamp: new Date().toISOString()
      };

      dispatch(addMessage({ sessionId, message: userMessage }));
      setInput('');
      setIsLoading(true);
      setError(null);

      try {
        const payload = { message: userMessage.content, use_rag: useRag, top_k: topK };
        const response: ChatResponse = await sendMessage(payload);
        const assistantMessage = {
          id: nanoid(),
          role: 'assistant' as const,
          content: response.message,
          timestamp: new Date().toISOString(),
          context: response.mode === 'rag' ? response.retrieved_context : undefined,
          avgSimilarity: response.avg_similarity ?? null
        };
        dispatch(addMessage({ sessionId, message: assistantMessage }));
        setRetrievedChunks(assistantMessage.context ?? []);
        setAvgSimilarity(assistantMessage.avgSimilarity ?? null);
      } catch (apiError) {
        setError('Request failed. Verify backend availability for controlled trials.');
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, input, isLoading, sessionId, topK, useRag]
  );

  const topKOptions = useMemo(() => [3, 4, 5], []);

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <RagToggle value={useRag} onChange={setUseRag} />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <span>Top-k</span>
              <select
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value))}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                {topKOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-gray-500">Messages timestamped via local time for audit logs.</p>
        </div>
        <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <p className="text-sm text-gray-500">
              Begin the comparative session by describing an information need; toggle RAG to contrast answers.
            </p>
          )}
          {messages.map((message) => {
            const localTime = new Date(message.timestamp).toLocaleTimeString();
            return (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xl rounded-lg px-4 py-3 text-sm shadow ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-gray-800'
                  }`}
                >
                  <div className="mb-1 text-xs opacity-70">{localTime}</div>
                  {message.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none">
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs rounded-lg bg-slate-100 px-4 py-2 text-sm text-gray-600 shadow">
                Thinking…
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="border-t border-gray-200 px-4 py-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            placeholder="Enter your prompt"
            className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            {error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : (
              <span className="text-xs text-gray-400">Identical prompts recommended per condition.</span>
            )}
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !sessionId}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              Send
            </button>
          </div>
        </form>
      </div>
      {useRag && (
        <RetrievedContext chunks={retrievedChunks} avgSimilarity={avgSimilarity ?? undefined} />
      )}
    </div>
  );
};

export default ChatUI;
