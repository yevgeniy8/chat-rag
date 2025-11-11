import React, { useState } from 'react';
import type { AxiosError } from 'axios';
import { buildFileDownloadUrl, fetchFilePreview } from '../api/files';
import FilePreviewModal from './FilePreviewModal';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteFile, fetchFiles } from '../store/filesSlice';
import type { FileRecord } from '../types/api';

const FilesList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, isLoading, error } = useAppSelector((state) => state.files);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewDownloadUrl, setPreviewDownloadUrl] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<FileRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const openPreview = async (file: FileRecord) => {
    setPreviewTitle(file.filename);
    setPreviewDownloadUrl(buildFileDownloadUrl(file.file_id));
    setPreviewContent('Loading preview…');
    setIsPreviewOpen(true);
    try {
      const { content } = await fetchFilePreview(file.file_id);
      if (content.trim().length === 0) {
        setPreviewContent('Document does not contain readable text to preview.');
      } else {
        setPreviewContent(content);
      }
    } catch (previewError) {
      let message = 'Preview unavailable. File is not readable or format not supported.';
      const axiosError = previewError as AxiosError<{ detail?: string }>;
      if (axiosError.response?.data?.detail) {
        message = axiosError.response.data.detail;
      }
      setPreviewContent(message);
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewContent('');
    setPreviewTitle('');
    setPreviewDownloadUrl(undefined);
  };

  const confirmDelete = (file: FileRecord) => {
    setDeleteTarget(file);
  };

  const cancelDelete = () => setDeleteTarget(null);

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      setIsDeleting(deleteTarget.file_id);
      await dispatch(deleteFile(deleteTarget.file_id)).unwrap();
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error(deleteError);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Knowledge Base Files</h3>
          <p className="text-sm text-gray-500">
            Uploaded documents are ready for search and quick preview here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchFiles())}
          className="rounded-md border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
        {isLoading ? (
          <p className="p-4 text-sm text-gray-500">Loading files…</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No files have been uploaded yet.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  File name
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Uploaded
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((file) => (
                <tr key={file.file_id} className="bg-white">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openPreview(file)}
                      className="text-left font-medium text-blue-600 hover:underline"
                    >
                      {file.filename}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{file.file_type.toUpperCase()}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(file.uploaded_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openPreview(file)}
                        className="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(file)}
                        className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        title={previewTitle}
        content={previewContent}
        downloadUrl={previewDownloadUrl}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={cancelDelete}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h4 className="text-lg font-semibold text-gray-900">Delete document</h4>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to remove <strong>{deleteTarget.filename}</strong>? This will also purge its
              embeddings from the vector store.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting === deleteTarget.file_id}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isDeleting === deleteTarget.file_id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FilesList;
