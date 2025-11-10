/**
 * Thesis Context: Files page guides participants through corpus ingestion, clarifying how raw documents feed
 * the RAG pipeline and ensuring repeatable data preparation across trials.
 */
import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';

const FilesPage: React.FC = () => {
  const [lastIngest, setLastIngest] = useState<{ fileName: string; chunks: number } | null>(null);

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
      {lastIngest && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Last indexed <strong>{lastIngest.fileName}</strong> into {lastIngest.chunks} searchable chunks.
        </div>
      )}
    </div>
  );
};

export default FilesPage;
