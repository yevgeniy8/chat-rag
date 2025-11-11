/**
 * Thesis Context: Landing page orients evaluators to the experimental flow—ingest documents then contrast
 * chat outputs with and without retrieval—to maintain procedural consistency.
 */
import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl space-y-8 rounded-2xl border border-gray-200 bg-white p-10 shadow-lg">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Experiment playground</p>
        <h1 className="text-3xl font-bold text-gray-900">Benchmark retrieval-augmented answers beside baseline replies</h1>
        <p className="text-sm text-gray-600">
          This workspace is designed for rapid iteration when analysing how RAG changes the character of an LLM answer.
          Every prompt you submit is stored as a session complete with latency measurements, cosine similarities, and
          timestamps—ideal for storytelling in research notes or stakeholder reports.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-700">1 · Curate</h2>
          <p className="mt-2 text-sm text-blue-900">
            Upload PDFs, DOCX files, or text snippets in the <strong>Files</strong> area. The ingestion pipeline embeds and
            indexes them so the retriever is primed before you start chatting.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">2 · Compare</h2>
          <p className="mt-2 text-sm text-emerald-900">
            Use the <strong>Compare</strong> view to send prompts once. The backend calls both the baseline LLM and the
            retrieval-augmented pipeline, records timings, and calculates semantic overlap.
          </p>
        </div>
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-purple-700">3 · Analyse</h2>
          <p className="mt-2 text-sm text-purple-900">
            Browse stored sessions, replay answers, and export insights. Latency gaps and similarity trends surface which
            prompts truly benefit from retrieval.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <h2 className="text-base font-semibold text-gray-800">Why this matters</h2>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li>• Measure latency trade-offs before committing RAG to production workloads.</li>
          <li>• Track semantic similarity to ensure retrieval isn’t diluting the original answer quality.</li>
          <li>• Preserve a navigable audit trail of conversations for compliance or academic replication.</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-4">
        <Link
          to="/compare"
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          Open the Compare view
        </Link>
        <Link
          to="/files"
          className="rounded-md bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 shadow hover:bg-gray-300"
        >
          Manage corpus files
        </Link>
      </div>
    </div>
  );
};

export default Home;
