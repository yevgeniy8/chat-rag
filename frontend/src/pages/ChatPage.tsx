import React, { useEffect, useMemo, useRef, useState } from 'react';
import { runRagQuery } from '../api/rag';
import { RagQueryResponse, RagSourceChunk } from '../types/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: RagSourceChunk[];
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}

const createMessage = (role: 'user' | 'assistant', content: string, sources?: RagSourceChunk[]): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
  sources,
  createdAt: new Date().toISOString()
});

const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 'session-1', title: 'New chat', messages: [] }
  ]);
  const [activeId, setActiveId] = useState('session-1');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conv) => conv.id === activeId) ?? conversations[0],
    [activeId, conversations]
  );

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages.length]);

  const startNewConversation = () => {
    const id = crypto.randomUUID();
    const newConversation: Conversation = { id, title: 'New chat', messages: [] };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveId(id);
    setPrompt('');
  };

  const updateConversation = (updater: (messages: ChatMessage[]) => ChatMessage[]) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === activeId ? { ...conv, messages: updater(conv.messages) } : conv))
    );
  };

  const handleSend = async () => {
    if (!prompt.trim() || !activeConversation) return;
    setIsLoading(true);
    setError(null);
    const userMessage = createMessage('user', prompt.trim());
    updateConversation((messages) => [...messages, userMessage]);
    setPrompt('');
    try {
      const response: RagQueryResponse = await runRagQuery({
        question: userMessage.content,
        history: activeConversation.messages.map((message) => ({ role: message.role, content: message.content }))
      });
      const assistantMessage = createMessage('assistant', response.answer, response.sources);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeId
            ? {
                ...conv,
                title: conv.title === 'New chat' ? userMessage.content.slice(0, 42) : conv.title,
                messages: [...conv.messages, userMessage, assistantMessage]
              }
            : conv
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to contact the RAG endpoint.');
      updateConversation((messages) => messages.filter((message) => message.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const copyMessage = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Chat history</h2>
          <button
            type="button"
            onClick={startNewConversation}
            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-slate-800"
          >
            + New
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                conv.id === activeId
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="line-clamp-2 font-semibold">{conv.title}</div>
              <p className="text-xs text-slate-400">{conv.messages.length / 2} turn(s)</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">RAG Chat</p>
            <h1 className="text-xl font-semibold text-slate-900">Ask questions with grounded responses</h1>
            <p className="text-sm text-slate-500">
              Messages include cited chunks from your uploaded documents. Send a message to see the latest retrieval set.
            </p>
          </div>
          {error && <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{error}</div>}
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {activeConversation?.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-500">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-slate-900 opacity-20" />
              <p className="text-sm font-medium text-slate-600">Start the conversation with a question about your knowledge base.</p>
            </div>
          ) : (
            activeConversation?.messages.map((message) => (
              <div key={message.id} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span
                      className={`h-8 w-8 rounded-full text-center text-base font-bold leading-8 ${
                        message.role === 'user'
                          ? 'bg-slate-900 text-white'
                          : 'bg-gradient-to-br from-blue-500 to-slate-900 text-white'
                      }`}
                    >
                      {message.role === 'user' ? 'You' : 'AI'}
                    </span>
                    <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                  </div>
                  {message.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => copyMessage(message.content)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      Copy
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">{message.content}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Retrieved chunks</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {message.sources.map((source, index) => (
                        <article
                          key={`${message.id}-source-${index}`}
                          className="rounded-lg border border-blue-100 bg-white/70 p-3 text-xs shadow-sm"
                        >
                          <p className="font-semibold text-blue-700">{source.source ?? 'Document'} </p>
                          {source.score !== undefined && (
                            <p className="text-[11px] text-blue-500">Score: {source.score.toFixed(3)}</p>
                          )}
                          <p className="mt-1 text-slate-700">{source.text}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messageEndRef} />
        </div>

        <footer className="border-t border-slate-200 px-6 py-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-inner">
            <textarea
              placeholder="Ask a question about your documents..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="w-full resize-none rounded-xl border border-transparent bg-transparent px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-200 focus:ring-0"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">Press Enter to send, Shift + Enter for a new line.</p>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isLoading || !prompt.trim()}
                className="rounded-full bg-gradient-to-r from-blue-600 to-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:from-blue-500 hover:to-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Generating…' : 'Send'}
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default ChatPage;
