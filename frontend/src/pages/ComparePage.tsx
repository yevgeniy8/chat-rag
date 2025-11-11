import React from 'react';
import CompareTab from '../components/CompareTab';

const ComparePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Dual-response comparison workspace</h2>
        <p className="mt-2 text-sm text-gray-600">
          Fire one prompt and capture two model answers, each with their own latency measurements. Cosine similarity is
          logged automatically so you can judge how closely the RAG response tracks the baseline narrative.
        </p>
      </section>
      <CompareTab />
    </div>
  );
};

export default ComparePage;
