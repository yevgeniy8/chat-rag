import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getChatHistory, runChatQuery, fetchDebugInfo } from '../api/chat';
import { ChatHistoryItem, RetrievedChunk } from '../types/api';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugChunks, setDebugChunks] = useState<RetrievedChunk[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const history = await getChatHistory();
        setMessages(history);
      } catch (err) {
        setError('Unable to load chat history. Please log in again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    const userMessage: ChatHistoryItem = { role: 'user', content: input.trim() };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput('');
    setIsLoading(true);
    setError(null);
    try {
      const response = await runChatQuery({ question: userMessage.content, chat_history: nextHistory });
      const assistantMessage: ChatHistoryItem = { role: 'assistant', content: response.answer };
      setMessages([...nextHistory, assistantMessage]);
      if (response.retrieved_chunks) {
        setDebugChunks(response.retrieved_chunks);
      } else {
        setDebugChunks([]);
      }
    } catch (err) {
      setError('Unable to send message. Verify your token is valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDebug = async () => {
    try {
      const chunks = await fetchDebugInfo();
      setDebugChunks(chunks);
    } catch (err) {
      setError('Unable to fetch debug information.');
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Chat</h2>
        <p className="text-sm text-slate-600">Conversations, files, and retrieval stay isolated per user.</p>
      </header>

      <section className="flex flex-1 flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto rounded-md border border-slate-100 bg-slate-50 p-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-3xl rounded-lg px-4 py-2 text-sm shadow-sm ${
                  message.role === 'assistant'
                    ? 'bg-white text-slate-800 border border-slate-200'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none">
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="space-y-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Ask a question about your uploaded documents"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="h-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isLoading ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Retrieved context</h3>
            <p className="text-xs text-slate-600">Chunks returned from FAISS for this user.</p>
          </div>
          <button
            type="button"
            onClick={loadDebug}
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh debug
          </button>
        </div>
        {debugChunks.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Send a message to view retrieved chunks.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            {debugChunks.map((chunk, index) => (
              <li key={index} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{chunk.source ?? 'snippet'}</span>
                  <span>Score: {chunk.score.toFixed(3)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-slate-800">{chunk.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ChatPage;
