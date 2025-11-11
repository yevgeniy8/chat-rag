import React from 'react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  downloadUrl?: string;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  content,
  title,
  downloadUrl
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-xl p-6 shadow-xl max-h-[80vh] w-full max-w-3xl overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={`Preview of ${title}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title || 'Document preview'}</h2>
            <p className="text-sm text-gray-500">Showing the first 1000 characters of the document.</p>
          </div>
          <div className="flex gap-2">
            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Download Original
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-900 px-3 py-1 text-sm font-semibold text-white shadow hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
          {content || 'No preview content available.'}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
