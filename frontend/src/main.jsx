/**
 * main.jsx  —  React application entry point
 *
 * Mounts the React tree into #root with:
 *   • Redux Provider  — global state
 *   • BrowserRouter   — client-side routing
 *   • Global CSS      — design tokens + utility classes
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import store from './store';
import App   from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
