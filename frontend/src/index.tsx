/**
 * Thesis Context: CRA entry point bootstraps the controlled frontend, importing Tailwind utilities to maintain
 * consistent styling across evaluation sessions and render the root React tree.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found; verify CRA scaffold.');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
