import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/fraunces'; // fuente de exhibición para títulos grandes
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ConfigError from './components/ConfigError.jsx';
import { supabaseConfigurado } from './services/supabase';
import { iniciarPwa } from './pwa/pwa';

iniciarPwa();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {supabaseConfigurado ? (
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      ) : (
        <ConfigError />
      )}
    </ErrorBoundary>
  </StrictMode>
);
