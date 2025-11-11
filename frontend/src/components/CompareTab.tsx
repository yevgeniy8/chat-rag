import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { compareMessage } from '../api/chat';
import { CompareResponse } from '../types/api';

const CompareTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      setError('Enter a query to run the comparison.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await compareMessage({ query });
      setResult(response);
    } catch (apiError) {
      setError('Comparison failed. Ensure the backend is reachable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700" htmlFor="compare-query">
          Compare a prompt across baseline and RAG
        </label>
        <textarea
          id="compare-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={4}
          className="mt-3 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Ask a question to evaluate retrieval impact"
        />
        <div className="mt-4 flex items-center justify-between">
          {error ? <p className="text-xs text-red-500">{error}</p> : <span className="text-xs text-gray-400">Latency and similarity metrics update after each run.</span>}
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isLoading ? 'Comparing…' : 'Run comparison'}
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Baseline</h3>
              <div className="mt-3 text-sm text-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none">
                  {result.baseline}
                </ReactMarkdown>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">RAG</h3>
              <div className="mt-3 text-sm text-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none">
                  {result.rag}
                </ReactMarkdown>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
            {(() => {
              const formattedSimilarity = Number.isFinite(result.similarity)
                ? result.similarity.toFixed(2)
                : 'N/A';
              return (
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Latency:
                    <strong className="ml-1 text-gray-800">{result.latency} ms</strong>
                  </span>
                  <span>
                    Semantic similarity:
                    <strong className="ml-1 text-gray-800">{formattedSimilarity}</strong>
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareTab;
