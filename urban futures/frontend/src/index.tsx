import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// Temporarily disable StrictMode to prevent double renders during map initialization
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

