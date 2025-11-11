/**
 * Thesis Context: Chat page hosts the comparative interface where identical prompts are tested against RAG-on
 * and baseline modes, preserving interaction logs for analytical evaluation.
 */
import React from 'react';
const ChatPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Session-Centric Conversations</h2>
        <p className="mt-2 text-sm text-gray-600">
          Launch a fresh comparison from the <strong>Compare</strong> tab to capture baseline and retrieval-augmented
          answers in a dedicated session. Every run records latency and similarity metrics so you can revisit the
          evidence later.
        </p>
      </section>
      <section className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-6 text-sm text-blue-900 shadow-sm">
        <h3 className="text-base font-semibold">Need a starting point?</h3>
        <p className="mt-2">
          Try framing a question that benefits from external knowledge, such as “Summarise the onboarding guide for new
          analysts.” Submit it in the Compare view and watch both the baseline and RAG models respond while timings are
          captured automatically.
        </p>
      </section>
    </div>
  );
};

export default ChatPage;
