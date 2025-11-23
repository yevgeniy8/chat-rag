import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getEvaluation, listEvaluations } from '../api/evaluation';
import { EvaluationResult } from '../types/api';

const History: React.FC = () => {
  const [items, setItems] = useState<EvaluationResult[]>([]);
  const [selected, setSelected] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const data = await listEvaluations();
        setItems(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load evaluation history.');
      }
    })();
  }, []);

  const openRecord = async (id: string) => {
    try {
      const record = await getEvaluation(id);
      setSelected(record);
    } catch (err) {
      console.error(err);
      setError('Unable to load evaluation details.');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Evaluation history</h2>
            <p className="text-sm text-gray-600">Saved comparisons with baseline and RAG outputs.</p>
          </div>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer text-gray-800 hover:bg-slate-50"
                  onClick={() => openRecord(item.id)}
                >
                  <td className="px-4 py-3 text-sm font-medium">{item.question}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-500" colSpan={2}>
                    No evaluations saved yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800">{selected.question}</h3>
                <p className="text-xs text-gray-500">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-gray-700">
                Models: {selected.model_baseline} / {selected.model_rag}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-gray-700">Baseline answer</h4>
                <div className="prose prose-sm mt-2 max-w-none text-gray-800">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.baseline_answer}</ReactMarkdown>
                </div>
              </article>
              <article className="rounded-xl border border-gray-100 bg-white p-4">
                <h4 className="text-sm font-semibold text-gray-700">RAG answer</h4>
                <div className="prose prose-sm mt-2 max-w-none text-gray-800">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.rag_answer}</ReactMarkdown>
                </div>
              </article>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-700">
                <h5 className="text-sm font-semibold text-gray-800">Baseline metrics</h5>
                <pre className="mt-2 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-gray-700">{JSON.stringify(selected.metrics.baseline, null, 2)}</pre>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-700">
                <h5 className="text-sm font-semibold text-gray-800">RAG metrics</h5>
                <pre className="mt-2 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-gray-700">{JSON.stringify(selected.metrics.rag, null, 2)}</pre>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-semibold text-gray-800">Retrieved chunks</h5>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                {selected.retrieved_chunks?.map((chunk, index) => (
                  <div key={index} className="rounded-lg border border-gray-100 bg-slate-50 p-3 text-sm text-gray-700">
                    <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(chunk, null, 2)}</pre>
                  </div>
                ))}
                {(!selected.retrieved_chunks || selected.retrieved_chunks.length === 0) && (
                  <p className="text-sm text-gray-500">No retrieved chunks were stored.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Select a saved evaluation to view details.
          </div>
        )}
      </section>
    </div>
  );
};

export default History;
