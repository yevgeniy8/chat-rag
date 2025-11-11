import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const sections = [
    {
      title: 'Files — Knowledge Base Storage',
      description:
        'Curate the evidence your assistant can cite. Upload PDFs, slides, or transcripts and we will slice them into searchable knowledge atoms that fuel retrieval.',
      to: '/files',
      action: 'Build the knowledge vault',
      accent: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: 'Analysis — Baseline vs. RAG',
      description:
        'Trigger simultaneous baseline and RAG generations to quantify latency, similarity, and lexical overlap. Export ready-to-use visuals for your thesis report.',
      to: '/chat',
      action: 'Start comparing',
      accent: 'bg-purple-50 text-purple-700 border-purple-200',
    }
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 rounded-3xl border border-slate-200 bg-white p-10 shadow-lg">
      <header className="space-y-4 text-slate-800">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Retrieval-Augmented Generation Playground
        </span>
        <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
          Discover how Retrieval-Augmented Generation transforms every conversation.
        </h1>
        <p className="text-lg text-slate-600">
          Our RAG system marries a fast vector search engine with a large language model. Instead of relying on
          the model’s memory alone, every prompt is enriched with the most relevant excerpts from your curated
          knowledge base. The result: citations you can trust, answers that stay on-topic, and workflows that grow
          smarter with each uploaded document.
        </p>
      </header>

      <section className="grid gap-6 rounded-2xl bg-slate-50 p-8 text-slate-700 sm:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Why teams choose this RAG stack</h2>
          <ul className="space-y-2 text-sm leading-relaxed">
            <li>
              <strong className="text-slate-900">Evidence on demand:</strong> Each response references the exact
              passages that inspired it, turning opaque generations into auditable research notes.
            </li>
            <li>
              <strong className="text-slate-900">Adaptive retrieval:</strong> Dense embeddings find the right
              context even when your wording shifts, so brainstorming stays fluid.
            </li>
            <li>
              <strong className="text-slate-900">Rapid iteration:</strong> Swap sources, re-index, and immediately
              test the impact in side-by-side chats without redeploying anything.
            </li>
          </ul>
        </div>
        <div className="flex flex-col justify-center space-y-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          <p>
            Two focused workspaces guide the study: curate the knowledge base via document uploads and run
            analytical comparisons that contrast baseline and retrieval-augmented answers with exportable charts.
          </p>
          <p className="font-medium text-slate-800">
            Ready to explore? Jump into any of the experiences below – each one is crafted to reveal how grounding
            reshapes AI output.
          </p>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.title}
            className={`flex h-full flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${section.accent}`}
          >
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">{section.title}</h3>
              <p className="text-sm leading-relaxed">{section.description}</p>
            </div>
            <div className="pt-4">
              <Link
                to={section.to}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {section.action}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <footer className="rounded-2xl border border-slate-200 bg-slate-900 p-8 text-slate-100">
        <h4 className="text-lg font-semibold">How it all comes together</h4>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">
          Uploading files seeds the vector store, and the analytical chat interface orchestrates retrieval and
          baseline generations side by side so you can document the lift grounded answers provide. Experiment,
          iterate, and capture insights that move your thesis – or product roadmap – forward.
        </p>
      </footer>
    </div>
  );
};

export default Home;
