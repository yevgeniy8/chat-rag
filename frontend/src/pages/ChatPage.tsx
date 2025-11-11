/**
 * Thesis Context: Chat page hosts the comparative interface where identical prompts are tested against RAG-on
 * and baseline modes, preserving interaction logs for analytical evaluation.
 */
import React from 'react';
import ChatUI from '../components/ChatUI';
import ChatSidebar from '../components/ChatSidebar';

const ChatPage: React.FC = () => {
  return (
    <div className="flex h-full flex-col space-y-4">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Compare Responses</h2>
        <p className="mt-2 text-sm text-gray-600">
          Use the toggle to switch between retrieval-augmented and baseline answering. Document differences in
          factual grounding and context usage for thesis reporting.
        </p>
      </section>
      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <ChatSidebar />
        <div className="flex-1">
          <ChatUI />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
