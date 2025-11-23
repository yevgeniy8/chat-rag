import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { analyzePrompt } from '../api/chat';
import { ChatAnalysisResponse } from '../types/api';

interface PlaygroundEntry {
  id: string;
  question: string;
  answer: string;
  latency: number;
  tokens: number;
  useRag: boolean;
  model: string;
}

const MODEL_OPTIONS = [
  { label: 'GPT-4o Mini', value: 'gpt-4o-mini', provider: 'openai' },
  { label: 'Llama 3', value: 'llama3', provider: 'openrouter' },
  { label: 'Claude 3 Haiku', value: 'claude-3-haiku', provider: 'openrouter' }
];

const Playground: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0].value);
  const [useRag, setUseRag] = useState<boolean>(true);
  const [history, setHistory] = useState<PlaygroundEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resolveProvider = (model: string): string => MODEL_OPTIONS.find((item) => item.value === model)?.provider ?? 'openai';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!question.trim()) {
      setError('Enter a prompt to send to the model.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        message: question.trim(),
        model: selectedModel,
        provider: resolveProvider(selectedModel),
        use_rag: useRag
      };
      const response: ChatAnalysisResponse = await analyzePrompt(payload);
      const answer = useRag ? response.rag_message : response.baseline_message;
      const latency = useRag ? response.rag_latency : response.baseline_latency;
      const tokens = useRag ? response.rag_tokens : response.baseline_tokens;
      setHistory((current) => [
        {
          id: `${Date.now()}`,
          question: question.trim(),
          answer,
          latency,
          tokens,
          useRag,
          model: selectedModel
        },
        ...current
      ]);
      setQuestion('');
    } catch (err) {
      console.error(err);
      setError('Unable to reach the backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Playground</h2>
        <p className="mt-2 text-sm text-gray-600">Quickly test prompts, toggle retrieval, and compare latency/token usage per model.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            placeholder="Ask a question..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="font-semibold text-gray-700">Model</span>
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-700">Use RAG</span>
                <span className="text-xs text-gray-500">Switch between raw model and retrieval-augmented answers.</span>
              </div>
              <button
                type="button"
                onClick={() => setUseRag((value) => !value)}
                className={`${useRag ? 'bg-blue-600' : 'bg-gray-300'} relative inline-flex h-7 w-14 items-center rounded-full transition`}
              >
                <span className={`${useRag ? 'translate-x-7 bg-white' : 'translate-x-1 bg-white'} inline-block h-5 w-5 transform rounded-full shadow transition`} />
              </button>
            </div>
            <div className="flex items-center justify-end gap-3">
              {error && <span className="text-xs text-red-500">{error}</span>}
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isLoading ? 'Sending…' : 'Send prompt'}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500 shadow-sm">
            No prompts yet. Run something to populate the history.
          </div>
        ) : (
          history.map((entry) => (
            <article key={entry.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{entry.question}</p>
                  <p className="text-xs text-gray-500">
                    {entry.useRag ? 'RAG' : 'Baseline'} · {entry.model} · {entry.latency.toFixed(3)} s · {entry.tokens} tokens
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.useRag ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {entry.useRag ? 'RAG on' : 'RAG off'}
                </span>
              </div>
              <div className="prose prose-sm mt-3 max-w-none text-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.answer}</ReactMarkdown>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};

export default Playground;
