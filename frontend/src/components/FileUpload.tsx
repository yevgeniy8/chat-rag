/**
 * Thesis Context: File upload component explicates the document ingestion phase, making corpus construction
 * observable for auditors and ensuring experimenters can trace RAG knowledge sources.
 */
import React, { useRef, useState } from 'react';
import { ingest, uploadFile } from '../api/ingest';
import { useAppDispatch } from '../store/hooks';
import { fetchFiles } from '../store/filesSlice';

interface FileUploadProps {
  onIngestComplete?: (info: { fileName: string; chunks: number }[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onIngestComplete }) => {
  const dispatch = useAppDispatch();
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string>('Awaiting selection');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    setFiles(selected);
    if (selected.length === 0) {
      setStatus('Awaiting selection');
    } else if (selected.length === 1) {
      setStatus(`Ready to upload ${selected[0].name}`);
    } else {
      setStatus(`Ready to upload ${selected.length} files`);
    }
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one document to index.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    const results: { fileName: string; chunks: number }[] = [];
    try {
      for (const file of files) {
        setStatus(`Uploading ${file.name}...`);
        const uploadResult = await uploadFile(file);
        setStatus(`Ingesting ${file.name}...`);
        const ingestResult = await ingest(uploadResult.file_id);
        results.push({ fileName: file.name, chunks: ingestResult.chunks });
      }
      setStatus(`Processed ${results.length} file${results.length === 1 ? '' : 's'} successfully.`);
      onIngestComplete?.(results);
      dispatch(fetchFiles());
      setFiles([]);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (uploadError) {
      console.log("uploadError", uploadError)
      setError('Ingestion failed. Please inspect backend logs for diagnostic replication.');
      setStatus('Upload interrupted. Some documents may not be indexed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Select documents</label>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700"
        />
        <p className="text-xs text-gray-500">Supported formats align with backend preprocessing capabilities.</p>
      </div>
      <button
        type="submit"
        disabled={files.length === 0 || isProcessing}
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
