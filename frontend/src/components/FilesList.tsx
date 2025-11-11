import React, { useState } from 'react';
import axios from 'axios';
import { buildRawFileUrl, fetchFilePreview } from '../api/files';
import { apiClient } from '../api/client';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteFile, fetchFiles } from '../store/filesSlice';
import { FilePreviewResponse } from '../types/api';

const FilesList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, isLoading, error } = useAppSelector((state) => state.files);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<FilePreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (fileName: string) => {
    try {
      setIsDeleting(fileName);
      await dispatch(deleteFile(fileName)).unwrap();
    } catch (deleteError) {
      console.error(deleteError);
    } finally {
      setIsDeleting(null);
    }
  };

  const resolvePreviewUrl = (path: string): string => {
    if (/^https?:/i.test(path)) {
      return path;
    }
    const base = apiClient.defaults.baseURL ?? '';
    return `${base}${path}`;
  };

  const openPreview = async (fileName: string) => {
    setPreviewFile(fileName);
    setPreviewData(null);
    setPreviewError(null);
    setIsPreviewLoading(true);
    try {
      const data = await fetchFilePreview(fileName);
      setPreviewData(data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 415) {
        setPreviewError('Preview not available for this file format.');
      } else {
        setPreviewError('Unable to load preview. Please try again.');
      }
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewData(null);
    setPreviewError(null);
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Knowledge Base Files</h3>
          <p className="text-sm text-gray-500">Uploaded documents appear here with quick access for preview or removal.</p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchFiles())}
          className="rounded-md border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>
      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading files…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">No files have been uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 text-sm">
            {items.map((file) => (
              <li key={file.name} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <button
                  type="button"
                  onClick={() => openPreview(file.name)}
                  className="flex-1 text-left font-medium text-blue-600 hover:underline"
                >
                  {file.name}
                </button>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB · {new Date(file.uploaded_at).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(file.name)}
                  disabled={isDeleting === file.name}
                  className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting === file.name ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>

      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closePreview}
        >
          <div
            className="relative h-[95vh] w-full max-w-3xl rounded-lg bg-white shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePreview}
              className="absolute right-3 top-3 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200"
            >
              Close
            </button>
            <div className="h-full w-full rounded-lg">
              {isPreviewLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-600">Loading preview…</div>
              ) : previewError ? (
                <div className="flex h-full items-center justify-center text-sm text-red-500">{previewError}</div>
              ) : previewData ? (
                (() => {
                  const lower = previewFile.toLowerCase();
                  const fileUrl = buildRawFileUrl(previewFile);
                  if (lower.endsWith('.pdf')) {
                    const src = previewData.preview_url ? resolvePreviewUrl(previewData.preview_url) : fileUrl;
                    return <iframe title={previewFile} src={src} className="h-full w-full rounded-lg" />;
                  }
                  if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
                    const googleUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
                    return <iframe title={previewFile} src={googleUrl} className="h-full w-full rounded-lg" />;
                  }
                  return <iframe title={previewFile} srcDoc={previewData.html ?? ''} className="h-full w-full rounded-lg" />;
                })()
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-600">Preview unavailable.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FilesList;
