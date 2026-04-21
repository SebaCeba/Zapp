import React from 'react';
import ReactDOM from 'react-dom/client';
import Router from './router';
import './index.css';
import 'rsuite/dist/rsuite.min.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
