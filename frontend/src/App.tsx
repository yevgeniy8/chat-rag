/**
 * Thesis Context: App shell wires navigation between ingestion, chat, and overview pages, enforcing clear
 * procedural steps for controlled experiments evaluating retrieval augmentation.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import FilesPage from './pages/FilesPage';
import ChatPage from './pages/ChatPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-slate-100">
        <header className="border-b border-gray-200 bg-white">
          <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <div className="text-lg font-semibold text-gray-900">LLM Chat Study</div>
            <div className="flex items-center gap-4 text-sm font-medium text-gray-700">
              <Link className="hover:text-blue-600" to="/">
                Home
              </Link>
              <Link className="hover:text-blue-600" to="/files">
                Files
              </Link>
              <Link className="hover:text-blue-600" to="/chat">
                Chat
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </main>
        <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
          Designed for the Master's thesis “LLM Chat with RAG vs No-RAG”.
        </footer>
      </div>
    </Router>
  );
};

export default App;
