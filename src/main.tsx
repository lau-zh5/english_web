import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initTheme } from './lib/theme';
import './index.css';

// 在首次渲染前定好主题，避免任何端口/入口下出现主题闪烁
initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
