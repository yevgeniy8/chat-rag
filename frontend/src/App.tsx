import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import FilesPage from './pages/FilesPage';
import ComparisonPage from './pages/ComparisonPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar';

const AuthenticatedShell: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <Navbar />
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6">
      <Outlet />
    </main>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AuthenticatedShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<ChatPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/compare" element={<ComparisonPage />} />
          <Route path="/upload" element={<FilesPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
