import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { analyzePrompt } from '../api/chat';
import { saveEvaluation } from '../api/evaluation';
import Charts from '../components/Charts';
import { ChatAnalysisResponse, EvaluationSaveRequest } from '../types/api';

const MODEL_OPTIONS = [
  { label: 'GPT-4o Mini', value: 'gpt-4o-mini', provider: 'openai' },
  { label: 'Llama 3', value: 'llama3', provider: 'openrouter' },
  { label: 'Claude 3 Haiku', value: 'claude-3-haiku', provider: 'openrouter' }
];

const Compare: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState<number>(6);
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0].value);
  const [evaluationMode, setEvaluationMode] = useState<boolean>(false);
  const [result, setResult] = useState<ChatAnalysisResponse | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const resolveProvider = (model: string): string => MODEL_OPTIONS.find((item) => item.value === model)?.provider ?? 'openai';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!question.trim()) {
      setStatus('Enter a question to compare baseline vs RAG.');
      return;
    }
    setIsLoading(true);
    setStatus('');
    try {
      const payload = {
        message: question.trim(),
        top_k: topK,
        model: selectedModel,
        provider: resolveProvider(selectedModel),
        use_rag: true
      };
      const response = await analyzePrompt(payload);
      setResult(response);
      if (evaluationMode) {
        const evaluationPayload: EvaluationSaveRequest = {
          question: question.trim(),
          rag_answer: response.rag_message,
          baseline_answer: response.baseline_message,
          metrics: {
            baseline: {
              latency: response.baseline_latency,
              tokens: response.baseline_tokens
            },
            rag: {
              latency: response.rag_latency,
              tokens: response.rag_tokens,
              cosine_similarity: response.cosine_similarity,
              bleu: response.bleu,
              rouge: response.rouge,
              avg_similarity: response.avg_similarity,
              answer_semantic_similarity: response.answer_semantic_similarity
            }
          },
          retrieved_chunks: response.retrieved_context,
          model_baseline: selectedModel,
          model_rag: selectedModel
        };
        await saveEvaluation(evaluationPayload);
        setStatus('Evaluation saved for this comparison.');
      }
    } catch (err) {
      console.error(err);
      setStatus('Unable to fetch comparison. Ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = useMemo(
    () =>
      result
        ? [
            { label: 'BLEU', baseline: 0, rag: result.bleu },
            { label: 'ROUGE-L', baseline: 0, rag: result.rouge },
            { label: 'Cosine', baseline: 0, rag: result.cosine_similarity },
            { label: 'Semantic', baseline: 0, rag: result.answer_semantic_similarity }
          ]
        : [],
    [result]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Baseline vs RAG comparison</h2>
            <p className="text-sm text-gray-600">Run a paired generation and inspect side-by-side answers with metrics.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label className="font-semibold text-gray-700">Evaluation mode</label>
            <button
              type="button"
              onClick={() => setEvaluationMode((value) => !value)}
              className={`${evaluationMode ? 'bg-blue-600' : 'bg-gray-300'} relative inline-flex h-7 w-14 items-center rounded-full transition`}
            >
              <span className={`${evaluationMode ? 'translate-x-7 bg-white' : 'translate-x-1 bg-white'} inline-block h-5 w-5 transform rounded-full shadow transition`} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Question</label>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Ask something your corpus should answer"
            />
          </div>
          <div className="space-y-3 rounded-lg border border-gray-200 bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Model</span>
              <select
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
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Top-k</span>
              <select
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              >
                {[4, 6, 8, 10, 12].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isLoading ? 'Running…' : 'Run comparison'}
            </button>
            {status && <p className="text-xs text-gray-500">{status}</p>}
          </div>
        </form>
      </section>

      {result && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <header className="mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Baseline</h3>
              <p className="text-xs text-gray-500">
                Latency: {result.baseline_latency.toFixed(3)} s · Tokens: {result.baseline_tokens}
              </p>
            </header>
            <div className="prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.baseline_message}</ReactMarkdown>
            </div>
          </article>

          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <header className="mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-600">RAG</h3>
              <p className="text-xs text-gray-500">
                Latency: {result.rag_latency.toFixed(3)} s · Tokens: {result.rag_tokens}
              </p>
              <p className="text-xs text-gray-500">
                Cosine: {result.cosine_similarity.toFixed(3)} · Avg retrieved: {result.avg_similarity.toFixed(3)} · Semantic: {result.answer_semantic_similarity.toFixed(3)}
              </p>
            </header>
            <div className="prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.rag_message}</ReactMarkdown>
            </div>
          </article>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800">Retrieved chunks</h3>
            <p className="text-xs text-gray-500">Top evidence returned by the vector store.</p>
            <ul className="mt-3 space-y-3 text-sm text-gray-700">
              {result.retrieved_context.map((chunk, index) => (
                <li key={`${chunk.file}-${index}`} className="rounded-lg border border-gray-100 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{chunk.file}</p>
                  <p className="text-xs text-gray-500">Similarity: {chunk.score.toFixed(3)}</p>
                  <p className="mt-1 text-gray-800">{chunk.snippet}</p>
                </li>
              ))}
            </ul>
          </div>
          <Charts data={chartData} />
        </div>
      )}
    </div>
  );
};

export default Compare;
