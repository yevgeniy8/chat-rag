import React, { useEffect, useMemo, useState } from 'react';
import { runComparison } from '../api/rag';
import { ComparisonResponse } from '../types/api';

interface HistoryEntry extends ComparisonResponse {
  id: string;
}

const HISTORY_KEY = 'comparison-history';

const ComparisonPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      setHistory(JSON.parse(stored) as HistoryEntry[]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!question.trim()) {
      setError('Enter a question to compare.');
      return;
    }
    setIsLoading(true);
    try {
      const comparison = await runComparison(question.trim());
      const entry: HistoryEntry = {
        ...comparison,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      setResult(entry);
      setHistory((prev) => [entry, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to retrieve comparison.');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreHistory = (entry: HistoryEntry) => {
    setResult(entry);
    setQuestion(entry.question);
  };

  const summaryMetrics = useMemo(() => {
    if (!result) return null;
    return [
      { label: 'Baseline vs RAG length', value: `${result.baseline.answer.length} / ${result.rag.answer.length} chars` },
      { label: 'Sources included', value: `${result.rag.sources?.length ?? 0}` },
      { label: 'Saved on', value: result.createdAt ? new Date(result.createdAt).toLocaleString() : '—' }
    ];
  }, [result]);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">History</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {history.length}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {history.length === 0 && <p className="text-sm text-slate-500">No comparisons yet.</p>}
          {history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => restoreHistory(entry)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300"
            >
              <p className="font-semibold leading-tight line-clamp-2">{entry.question}</p>
              <p className="text-xs text-slate-500">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="space-y-2 border-b border-slate-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Baseline vs RAG</p>
          <h1 className="text-xl font-semibold text-slate-900">Compare grounded answers against baseline generations</h1>
          <p className="text-sm text-slate-600">
            Submit a single question to request both baseline and retrieval-augmented answers. Each comparison is saved locally so
            you can revisit it later.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="text-sm font-semibold text-slate-800" htmlFor="question">
            Question
          </label>
          <textarea
            id="question"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-200 focus:ring-0"
            placeholder="Where does the baseline diverge from the RAG answer?"
          />
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">History is stored locally in your browser.</p>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-gradient-to-r from-blue-600 to-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:from-blue-500 hover:to-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Comparing…' : 'Compare responses'}
            </button>
          </div>
        </form>

        {result ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Baseline</p>
                  <p className="text-[11px] text-slate-400">Ungrounded answer</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Control</span>
              </header>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">{result.baseline.answer}</p>
            </article>

            <article className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">RAG</p>
                  <p className="text-[11px] text-blue-500">Grounded with retrieved context</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">+ Citations</span>
              </header>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-900">{result.rag.answer}</p>
              {result.rag.sources && result.rag.sources.length > 0 && (
                <div className="space-y-2 rounded-xl border border-blue-200 bg-white/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Sources</p>
                  <div className="space-y-2">
                    {result.rag.sources.map((source, index) => (
                      <div key={`${result.id}-source-${index}`} className="rounded-lg border border-blue-100 bg-white p-3 text-xs shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-700">{source.source ?? 'Document'}</span>
                          {source.score !== undefined && <span className="text-[11px] text-blue-500">{source.score.toFixed(3)}</span>}
                        </div>
                        <p className="mt-1 text-slate-700">{source.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Run a comparison to see baseline and retrieval-augmented answers side by side.
          </div>
        )}

        {summaryMetrics && (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
            {summaryMetrics.map((item) => (
              <div key={item.label} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-1 font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ComparisonPage;
