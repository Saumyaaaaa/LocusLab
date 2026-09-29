// Application entrypoint mounting the React DOM root with imported theme stylesheet.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
