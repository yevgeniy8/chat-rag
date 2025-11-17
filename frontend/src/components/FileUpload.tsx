/**
 * Thesis Context: File upload component explicates the document ingestion phase, making corpus construction
 * observable for auditors and ensuring experimenters can trace RAG knowledge sources.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ingest, uploadFile } from '../api/ingest';
import { useAppDispatch } from '../store/hooks';
import { fetchFiles } from '../store/filesSlice';

interface FileUploadProps {
  onIngestComplete?: (info: { fileName: string; chunks: number }[]) => void;
}

type UploadStatus = 'pending' | 'uploading' | 'ingesting' | 'complete' | 'error';

interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt'];

const FileUpload: React.FC<FileUploadProps> = ({ onIngestComplete }) => {
  const dispatch = useAppDispatch();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Drop documents here or browse to upload.');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewItem, setPreviewItem] = useState<{
    name: string;
    kind: 'pdf' | 'text' | 'word' | 'unsupported';
    url?: string;
    content?: string;
  } | null>(null);

  const hasFilesReady = uploads.some((item) => item.status === 'pending' || item.status === 'error');

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const selected = Array.from(incoming);
    if (selected.length === 0) {
      return;
    }
    const valid: UploadItem[] = [];
    const rejected: string[] = [];
    selected.forEach((file) => {
      const lower = file.name.toLowerCase();
      const isSupported = ACCEPTED_EXTENSIONS.some((extension) => lower.endsWith(extension));
      if (!isSupported) {
        rejected.push(file.name);
        return;
      }
      const id = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
      valid.push({ id, file, status: 'pending', progress: 0 });
    });

    if (rejected.length > 0) {
      setError(`Unsupported file type: ${rejected.join(', ')}`);
    } else {
      setError(null);
    }

    setUploads((current) => {
      const existingNames = new Set(current.map((item) => item.file.name));
      const deduped = valid.filter((item) => !existingNames.has(item.file.name));
      if (deduped.length === 0) {
        return current;
      }
      setStatusMessage(`Queued ${deduped.length} file${deduped.length === 1 ? '' : 's'} for ingestion.`);
      return [...current, ...deduped];
    });
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFiles(event.target.files);
      event.target.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isProcessing) {
      return;
    }
    setIsDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  const updateUpload = useCallback((id: string, updates: Partial<UploadItem>) => {
    setUploads((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const removeUpload = (id: string) => {
    setUploads((current) => current.filter((item) => item.id !== id));
  };

  const openPreview = (item: UploadItem) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    const lower = item.file.name.toLowerCase();
    if (lower.endsWith('.pdf')) {
      const objectUrl = URL.createObjectURL(item.file);
      previewUrlRef.current = objectUrl;
      setPreviewItem({ name: item.file.name, kind: 'pdf', url: objectUrl });
      return;
    }
    if (lower.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewItem({ name: item.file.name, kind: 'text', content: String(reader.result ?? '') });
      };
      reader.readAsText(item.file);
      return;
    }
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
      setPreviewItem({ name: item.file.name, kind: 'word' });
      return;
    }
    setPreviewItem({ name: item.file.name, kind: 'unsupported' });
  };

  const closePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewItem(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isProcessing) {
      return;
    }
    if (!hasFilesReady) {
      setError('Add at least one supported document to upload.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    const results: { fileName: string; chunks: number }[] = [];
    let encounteredError = false;

    try {
      for (const item of uploads) {
        if (item.status !== 'pending' && item.status !== 'error') {
          continue;
        }
        updateUpload(item.id, { status: 'uploading', progress: 10, error: undefined });
        setStatusMessage(`Uploading ${item.file.name}…`);
        try {
          const uploadResult = await uploadFile(item.file);
          updateUpload(item.id, { status: 'ingesting', progress: 60 });
          setStatusMessage(`Ingesting ${item.file.name}…`);
          const ingestResult = await ingest(uploadResult.file_id);
          updateUpload(item.id, { status: 'complete', progress: 100 });
          results.push({ fileName: item.file.name, chunks: ingestResult.chunks });
        } catch (err) {
          console.error('Upload failed', err);
          updateUpload(item.id, {
            status: 'error',
            progress: 100,
            error: 'Failed to ingest. Check backend logs.'
          });
          setError('Ingestion failed for one or more files. Review the list for details.');
          encounteredError = true;
        }
      }

      if (results.length > 0) {
        onIngestComplete?.(results);
        dispatch(fetchFiles());
        const suffix = results.length === 1 ? '' : 's';
        setStatusMessage(
          encounteredError
            ? `Processed ${results.length} file${suffix}, but some uploads failed. Review the list above.`
            : `Processed ${results.length} file${suffix} successfully.`
        );
      } else if (encounteredError) {
        setStatusMessage('Uploads completed with errors.');
      } else {
        setStatusMessage('No files were processed.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const resetQueue = () => {
    setUploads([]);
    setError(null);
    setStatusMessage('Drop documents here or browse to upload.');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    closePreview();
  };

  const dragClasses = useMemo(() => {
    const base = 'flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition';
    if (isProcessing) {
      return `${base} border-gray-200 bg-gray-50 text-gray-400`;
    }
    if (isDragActive) {
      return `${base} border-blue-400 bg-blue-50 text-blue-600`;
    }
    return `${base} border-gray-300 bg-gray-50 text-gray-600 hover:border-blue-400`;
  }, [isDragActive, isProcessing]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div
        className={dragClasses}
        onDragOver={(event) => {
          event.preventDefault();
          if (isProcessing) {
            return;
          }
          setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragActive(false);
        }}
        onDrop={handleDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
        aria-disabled={isProcessing}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />
        <p className="text-sm font-semibold">{isProcessing ? 'Processing uploads…' : 'Drag & drop or click to select files'}</p>
        <p className="mt-1 text-xs">Supported: PDF, DOCX, DOC, TXT</p>
      </div>

      {uploads.length > 0 && (
        <ul className="space-y-3 text-sm">
          {uploads.map((item) => (
            <li key={item.id} className="rounded-md border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-800">{item.file.name}</p>
                  <p className="text-xs text-gray-500">{(item.file.size / 1024).toFixed(1)} KB</p>
                </div>
                {item.status === 'pending' && !isProcessing && (
                  <button
                    type="button"
                    onClick={() => removeUpload(item.id)}
                    className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${item.status === 'error' ? 'bg-red-400' : item.status === 'complete' ? 'bg-green-400' : 'bg-blue-400'}`}
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="capitalize">{item.status}</span>
                  <button
                    type="button"
                    onClick={() => openPreview(item)}
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-slate-50"
                  >
                    Preview
                  </button>
                </div>
                {item.error && <span className="text-red-500">{item.error}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!hasFilesReady || isProcessing}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isProcessing ? 'Indexing…' : 'Upload & Ingest'}
        </button>
        <button
          type="button"
          onClick={resetQueue}
          disabled={uploads.length === 0 || isProcessing}
          className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear
        </button>
      </div>

      <p className="text-sm text-gray-600">{statusMessage}</p>
      {error && <p className="text-sm text-red-500">{error}</p>}

      {previewItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={closePreview}>
          <div
            className="relative h-[80vh] w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePreview}
              className="absolute right-4 top-4 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200"
            >
              Close
            </button>
            <h3 className="text-sm font-semibold text-gray-800">{previewItem.name}</h3>
            <div className="mt-4 h-[90%] overflow-hidden rounded-lg border border-gray-100 bg-slate-50">
              {previewItem.kind === 'pdf' && previewItem.url ? (
                <iframe title={previewItem.name} src={previewItem.url} className="h-full w-full" />
              ) : previewItem.kind === 'text' ? (
                <pre className="h-full w-full overflow-auto bg-white p-4 text-xs text-gray-700">
                  {previewItem.content}
                </pre>
              ) : previewItem.kind === 'word' ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center text-sm text-gray-600">
                  <p className="font-medium text-gray-800">Preview available after upload</p>
                  <p className="mt-2">
                    Once ingested, open the file from the list below to view it through the Google Docs viewer.
                  </p>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-sm text-gray-600">
                  Preview not available for this file type.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default FileUpload;
