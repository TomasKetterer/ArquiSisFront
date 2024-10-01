import React from 'react';
import ReactDOM from 'react-dom/client';
import dotenv from 'dotenv';
import './index.css';
import App from './App.js';
import reportWebVitals from './reportWebVitals.js';
import { Auth0Provider } from '@auth0/auth0-react';

// Configurar dotenv para cargar las variables de entorno
dotenv.config();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.DOMAIN}
      clientId={process.env.CLIENT_ID}
      redirectUri={window.location.origin}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
