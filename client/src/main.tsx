import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { notificationService } from './services/notificationService';

// Initialize PWA Service Worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    notificationService.registerServiceWorker().catch((err) => {
      console.warn('[PWA] Service worker registration notice:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

