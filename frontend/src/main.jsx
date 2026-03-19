import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

<<<<<<< HEAD
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
=======
// Clear any stale localStorage session data from older versions
['cmsRole', 'cmsUserId', 'cmsAuthenticated'].forEach((k) => localStorage.removeItem(k));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
>>>>>>> c10e7d5074fee957e11486f5f75b3bb8cdb2b414
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
