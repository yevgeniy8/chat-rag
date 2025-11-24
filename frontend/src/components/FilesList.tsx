import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteFile, fetchFiles } from '../store/filesSlice';

const FilesList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, isLoading, error } = useAppSelector((state) => state.files);

  useEffect(() => {
    dispatch(fetchFiles());
  }, [dispatch]);

  const handleDelete = async (name: string) => {
    await dispatch(deleteFile(name));
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Your files</h3>
          <p className="text-sm text-gray-500">Files are isolated per user account.</p>
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
          <p className="text-sm text-gray-500">No files uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 text-sm">
            {items.map((file) => (
              <li key={file.name} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-blue-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(file.uploaded_at).toLocaleString()} · {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(file.name)}
                  className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    </section>
  );
};

export default FilesList;
