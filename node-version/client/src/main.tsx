import React from 'react';
import ReactDOM from 'react-dom/client';
import Router from './router';
import 'rsuite/dist/rsuite.min.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
