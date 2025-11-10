/**
 * Thesis Context: RAG toggle operationalizes the experimental variable, letting evaluators flip between
 * retrieval-augmented and baseline LLM responses under identical UI affordances.
 */
import React from 'react';

interface RagToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

const RagToggle: React.FC<RagToggleProps> = ({ value, onChange }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
        value ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
      }`}
      aria-pressed={value}
    >
      <span
        className={`h-3 w-3 rounded-full ${value ? 'bg-white' : 'bg-gray-500'}`}
        aria-hidden
      />
      {value ? 'RAG ON' : 'RAG OFF'}
    </button>
  );
};

export default RagToggle;
