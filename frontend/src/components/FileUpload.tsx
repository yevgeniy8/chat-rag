/**
 * Thesis Context: File upload component explicates the document ingestion phase, making corpus construction
 * observable for auditors and ensuring experimenters can trace RAG knowledge sources.
 */
import React, { useState } from 'react';
import { ingest, uploadFile } from '../api/ingest';

interface FileUploadProps {
  onIngestComplete?: (info: { fileName: string; chunks: number }) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onIngestComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('Awaiting selection');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    setFile(selected ?? null);
    setStatus(selected ? `Ready to upload ${selected.name}` : 'Awaiting selection');
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a document to index.');
      return;
    }
    try {
      setIsProcessing(true);
      setStatus('Uploading to backend...');
      const uploadResult = await uploadFile(file);
      setStatus('Triggering vector store ingestion...');
      const ingestResult = await ingest(uploadResult.file_id);
      const newStatus = `Indexed ${ingestResult.chunks} chunks from ${file.name}`;
      setStatus(newStatus);
      setError(null);
      onIngestComplete?.({ fileName: file.name, chunks: ingestResult.chunks });
    } catch (uploadError) {
      setError('Ingestion failed. Please inspect backend logs for diagnostic replication.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Select document</label>
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700"
        />
        <p className="text-xs text-gray-500">Supported formats align with backend preprocessing capabilities.</p>
      </div>
      <button
        type="submit"
        disabled={!file || isProcessing}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {isProcessing ? 'Indexing…' : 'Upload & Ingest'}
      </button>
      <p className="text-sm text-gray-600">{status}</p>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
};

export default FileUpload;
