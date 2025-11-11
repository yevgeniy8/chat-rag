import React from 'react';
import CompareTab from '../components/CompareTab';

const ComparePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Compare Baseline vs Retrieval-Augmented Answers</h2>
        <p className="mt-2 text-sm text-gray-600">
          Submit a single prompt and review both the baseline response and the RAG-enhanced answer side by side, along with
          latency and semantic similarity metrics.
        </p>
      </section>
      <CompareTab />
    </div>
  );
};

export default ComparePage;
