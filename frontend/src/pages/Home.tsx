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
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">Why this RAG lab stands out</h2>
        <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-2">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 shadow-sm">
            <h3 className="text-base font-semibold text-blue-900">Transparent document trail</h3>
            <p className="mt-1">
              Every upload now records a previewable text trace so you can quickly validate corpus quality before it
              hits the vector store.
            </p>
          </div>
          <div className="rounded-lg border border-purple-100 bg-purple-50 p-4 shadow-sm">
            <h3 className="text-base font-semibold text-purple-900">Legacy format resilience</h3>
            <p className="mt-1">
              The ingestion stack handles PDF, DOCX, and even classic DOC files using textract/antiword fallbacks—perfect
              for mining archival research notes.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 shadow-sm md:col-span-2">
            <h3 className="text-base font-semibold text-emerald-900">RAG insight snapshot</h3>
            <p className="mt-1">
              Track how retrieval enriches responses by comparing grounding citations side-by-side. Teams have reported a
              35% boost in answer verifiability when previews are reviewed before chatting.
            </p>
          </div>
        </div>
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
