/**
 * Thesis Context: Analytical chat page pairs every prompt with baseline and RAG answers, exposing quantitative
 * metrics so researchers can document how retrieval changes factuality, latency, and textual alignment.
 */
import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ComparisonDashboard from '../components/ComparisonDashboard';
import RetrievedContext from '../components/RetrievedContext';
import { analyzePrompt } from '../api/chat';
import { ChatAnalysisResponse } from '../types/api';

const ChatPage: React.FC = () => {
  const MODEL_OPTIONS = [
    { label: 'GPT-4o Mini', value: 'gpt-4o-mini', provider: 'openai' },
    { label: 'Llama 3', value: 'llama3', provider: 'openrouter' },
    { label: 'Claude 3 Haiku', value: 'claude-3-haiku', provider: 'openrouter' }
  ];

  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState<number>(8);
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0].value);
  const [useRag, setUseRag] = useState<boolean>(true);
  const [result, setResult] = useState<ChatAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resolveProvider = (model: string): string => {
    const match = MODEL_OPTIONS.find((option) => option.value === model);
    return match?.provider ?? 'openai';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!question.trim()) {
      setError('Enter a question to run the analysis.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        message: question.trim(),
        top_k: topK,
        model: selectedModel,
        provider: resolveProvider(selectedModel),
        use_rag: useRag
      };
      const response = await analyzePrompt(payload);
      setResult(response);
    } catch (apiError) {
      console.error(apiError);
      setError('Unable to reach the backend. Verify the FastAPI service is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = useMemo(() => {
    if (!result) {
      return null;
    }
    return {
      baselineLatency: result.baseline_latency,
      ragLatency: result.rag_latency,
      baselineTokens: result.baseline_tokens,
      ragTokens: result.rag_tokens,
      cosineSimilarity: result.cosine_similarity,
      bleu: result.bleu,
      rouge: result.rouge,
      avgSimilarity: result.avg_similarity,
      answerSemanticSimilarity: result.answer_semantic_similarity
    };
  }, [result]);

  return (
    <div className="flex h-full flex-col gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Analytical comparison</h2>
        <p className="mt-2 text-sm text-gray-600">
          Submit a single question. The backend simultaneously runs baseline and retrieval-augmented generations,
          reporting latency, token usage, and alignment metrics to quantify retrieval impact.
        </p>
      </section>

      <div className="flex flex-1 flex-col gap-6 xl:flex-row">
        <section className="flex flex-1 flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="analysis-question" className="text-sm font-semibold text-gray-700">
                Research prompt
              </label>
              <textarea
                id="analysis-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Ask something your thesis corpus should answer"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-center">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-gray-700">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">Model</span>
                  <span className="text-xs text-gray-500">Choose provider-specific base model.</span>
                </div>
                <select
                  id="model"
                  value={selectedModel}
                  onChange={(event) => setSelectedModel(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                >
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-gray-700">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">Top-k chunks</span>
                  <span className="text-xs text-gray-500">Retrieval depth for context.</span>
                </div>
                <select
                  id="top-k"
                  value={topK}
                  onChange={(event) => setTopK(Number(event.target.value))}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                >
                  {[4, 6, 8, 10, 12].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-gray-700">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">Use RAG</span>
                  <span className="text-xs text-gray-500">Toggle retrieval augmentation.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseRag((value) => !value)}
                  className={`${useRag ? 'bg-blue-600' : 'bg-gray-300'} relative inline-flex h-7 w-14 items-center rounded-full transition`}
                >
                  <span
                    className={`${useRag ? 'translate-x-7 bg-white' : 'translate-x-1 bg-white'} inline-block h-5 w-5 transform rounded-full shadow transition`}
                  />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {error ? <p className="text-xs text-red-500">{error}</p> : <span className="text-xs text-gray-400">Latency reported in seconds.</span>}
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isLoading ? 'Analysing…' : 'Compare answers'}
              </button>
            </div>
          </form>

          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            {result ? (
              <>
                <article className="flex flex-col rounded-xl border border-gray-200 bg-slate-50 p-4 shadow-sm">
                  <header className="mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Baseline</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Latency: {result.baseline_latency.toFixed(3)} s · Tokens: {result.baseline_tokens}
                    </p>
                  </header>
                  <div className="prose prose-sm max-w-none text-gray-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.baseline_message}</ReactMarkdown>
                  </div>
                </article>

                <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <header className="mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-600">RAG</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Latency: {result.rag_latency.toFixed(3)} s · Tokens: {result.rag_tokens}
                    </p>
                    <div className="mt-1 text-xs text-gray-500 space-y-1">
                      <div>
                        Avg similarity: {result.avg_similarity.toFixed(3)} · BLEU: {result.bleu.toFixed(3)} · ROUGE-L:{' '}
                        {result.rouge.toFixed(3)}
                      </div>
                      <div>
                        Cosine: {result.cosine_similarity.toFixed(3)} · Semantic: {result.answer_semantic_similarity.toFixed(3)}
                      </div>
                    </div>
                  </header>
                  <div className="prose prose-sm max-w-none text-gray-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.rag_message}</ReactMarkdown>
                  </div>
                </article>
              </>
            ) : (
              <div className="col-span-2 flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-slate-50 p-6 text-sm text-gray-500">
                Run a comparison to populate baseline and RAG answers.
              </div>
            )}
          </div>
        </section>

        <div className="flex w-full flex-col gap-6 xl:w-[28rem]">
          {metrics ? (
            <ComparisonDashboard {...metrics} />
          ) : (
            <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500 shadow-sm">
              Metrics will appear once a comparison has been executed.
            </section>
          )}

          <section className="flex-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700">Retrieved context</h3>
            <p className="mt-1 text-xs text-gray-500">Evidence supplied to the RAG answer.</p>
            <div className="mt-4 h-[22rem] overflow-hidden">
              <RetrievedContext chunks={result?.retrieved_context ?? []} avgSimilarity={result?.avg_similarity} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
