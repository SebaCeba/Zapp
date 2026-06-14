import React from 'react';
import ReactDOM from 'react-dom/client';
import Router from './router';
import 'rsuite/dist/rsuite.min.css';
import './index.css';

const apiKey = import.meta.env.VITE_API_KEY;
const nativeFetch = window.fetch.bind(window);

window.fetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  if (!apiKey || !url.startsWith('/api')) {
    return nativeFetch(input, init);
  }

  const headers = new Headers(init.headers);
  headers.set('x-api-key', apiKey);

  return nativeFetch(input, { ...init, headers });
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
