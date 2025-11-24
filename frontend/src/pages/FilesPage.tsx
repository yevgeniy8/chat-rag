import React, { useMemo, useState } from 'react';
import FileUpload from '../components/FileUpload';
import FilesList from '../components/FilesList';

const FilesPage: React.FC = () => {
  const [lastIngest, setLastIngest] = useState<{ fileName: string; chunks: number }[] | null>(null);
  const summary = useMemo(() => {
    if (!lastIngest || lastIngest.length === 0) {
      return null;
    }
    const totalChunks = lastIngest.reduce((acc, item) => acc + item.chunks, 0);
    const names = lastIngest.map((item) => `${item.fileName} (${item.chunks})`).join(', ');
    return { totalChunks, names, count: lastIngest.length };
  }, [lastIngest]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Document uploads</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Build the knowledge vault</h2>
            <p className="text-sm text-slate-600">
              Upload PDFs, DOCX, DOC, or TXT files. We will index them so RAG answers can cite relevant snippets.
            </p>
          </div>
          {summary && (
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              Indexed {summary.count} file{summary.count === 1 ? '' : 's'} totaling {summary.totalChunks} chunks.
            </div>
          )}
        </div>
      </section>

      <FileUpload onIngestComplete={setLastIngest} />

      <FilesList />
    </div>
  );
};

export default FilesPage;
