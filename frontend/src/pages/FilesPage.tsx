import React from 'react';
import FileUpload from '../components/FileUpload';
import FilesList from '../components/FilesList';

const FilesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Manage your knowledge base</h2>
        <p className="mt-2 text-sm text-gray-600">
          Upload documents to build your personal FAISS index. Files, chat history, and retrieval are scoped to your
          account.
        </p>
      </section>
      <FileUpload />
      <FilesList />
    </div>
  );
};

export default FilesPage;
