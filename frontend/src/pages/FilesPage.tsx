/**
 * Thesis Context: Files page guides participants through corpus ingestion, clarifying how raw documents feed
 * the RAG pipeline and ensuring repeatable data preparation across trials.
 */
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
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Prepare Retrieval Corpus</h2>
        <p className="mt-2 text-sm text-gray-600">
          Upload thesis datasets or evaluation documents here. The system streams the file to the backend, indexes
          it into FAISS, and reports the resulting chunk count for transparency.
        </p>
      </section>
      <FileUpload onIngestComplete={setLastIngest} />
      {summary && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Indexed {summary.count} file{summary.count === 1 ? '' : 's'} ({summary.names}) totaling {summary.totalChunks} searchable chunks.
        </div>
      )}
      <FilesList />
    </div>
  );
};

export default FilesPage;
