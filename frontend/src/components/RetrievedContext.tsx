/**
 * Thesis Context: Retrieved context panel exposes the evidence fed into the RAG pipeline, improving transparency
 * and allowing evaluators to audit alignment between retrieved snippets and model responses.
 */
import React from 'react';
import { RetrievedContext as RetrievedContextType } from '../types/api';

interface RetrievedContextProps {
  chunks: RetrievedContextType[];
  avgSimilarity?: number | null;
}

const RetrievedContext: React.FC<RetrievedContextProps> = ({ chunks, avgSimilarity }) => {
  if (!chunks.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
        Context will appear here when RAG is active.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-700">Retrieved Context</h3>
        {typeof avgSimilarity === 'number' && (
          <p className="text-xs text-gray-500">Avg similarity: {avgSimilarity.toFixed(2)}</p>
        )}
      </div>
      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {chunks.map((chunk, index) => (
          <div
            key={`${chunk.file}-${index}`}
            className="rounded-md border border-gray-200 bg-slate-50 p-3 text-sm shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-gray-700">{chunk.file}</span>
              <span>Score: {chunk.score.toFixed(2)}</span>
            </div>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-700">{chunk.snippet}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RetrievedContext;
