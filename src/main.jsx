import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Importar estilos de Bootstrap y Bootstrap Icons
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Importar JavaScript de Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Importar estilos personalizados
import './styles/main.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);