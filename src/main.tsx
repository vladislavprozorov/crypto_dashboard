/**
 * External imports
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Local imports
 */
import Providers from './app/Providers.tsx';
import './styles/index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);
