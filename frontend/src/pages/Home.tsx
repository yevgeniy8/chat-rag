/**
 * Thesis Context: Landing page orients evaluators to the experimental flow—ingest documents then contrast
 * chat outputs with and without retrieval—to maintain procedural consistency.
 */
import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">LLM Chat with RAG vs No-RAG</h1>
        <p className="text-sm text-gray-600">
          Upload curated documents, trigger retrieval indexing, then compare conversational responses under
          retrieval-augmented (RAG) and baseline settings for rigorous thesis evaluation.
        </p>
      </header>
      <section className="space-y-2 text-sm text-gray-600">
        <p>
          Experimental workflow: (1) load corpus in <strong>Files</strong>, (2) chat via <strong>Chat</strong>, (3) toggle
          RAG to compare evidence-backed vs. baseline outputs, documenting findings.
        </p>
        {/* Run instructions kept inline to guarantee consistent onboarding across experiment replications. */}
        <pre className="rounded-md bg-slate-100 p-4 text-xs text-gray-700">
{`# install
npm install

# run
npm start

# env
cp .env.example .env
# set REACT_APP_API_BASE_URL=http://localhost:8000`}
        </pre>
      </section>
      <div className="flex flex-wrap gap-4">
        <Link
          to="/files"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          Go to Files
        </Link>
        <Link
          to="/chat"
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow hover:bg-gray-300"
        >
          Go to Chat
        </Link>
      </div>
    </div>
  );
};

export default Home;
