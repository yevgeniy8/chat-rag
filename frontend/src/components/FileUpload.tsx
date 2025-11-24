import React, { useRef, useState } from 'react';
import { uploadFile } from '../api/files';
import { useAppDispatch } from '../store/hooks';
import { fetchFiles } from '../store/filesSlice';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelect = () => {
    inputRef.current?.click();
  };

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }
    const file = event.target.files[0];
    event.target.value = '';
    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await uploadFile(file);
      setSuccessMessage(`Uploaded ${file.name}`);
      dispatch(fetchFiles());
      onUploadComplete?.();
    } catch (err) {
      setError('Upload failed. Please verify you are logged in and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      await handleUpload(event.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
      className="rounded-lg border-2 border-dashed border-slate-300 bg-white p-6 text-center shadow-sm"
    >
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
      <p className="text-sm text-slate-600">Upload knowledge files for your account.</p>
      <div className="mt-4 flex justify-center gap-3">
        <button
          type="button"
          onClick={handleSelect}
          disabled={isUploading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isUploading ? 'Uploading…' : 'Select file'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {successMessage && <p className="mt-3 text-sm text-green-600">{successMessage}</p>}
    </div>
  );
};

export default FileUpload;
