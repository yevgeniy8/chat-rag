import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface MetricDatum {
  label: string;
  baseline: number;
  rag: number;
}

interface ChartsProps {
  data: MetricDatum[];
}

const Charts: React.FC<ChartsProps> = ({ data }) => {
  return (
    <div className="h-72 w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800">Metric comparison</h3>
      <p className="text-xs text-gray-500">Baseline vs RAG across BLEU, ROUGE-L, cosine, and semantic similarity.</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 1]} />
            <Tooltip cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="baseline" fill="#9ca3af" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rag" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
