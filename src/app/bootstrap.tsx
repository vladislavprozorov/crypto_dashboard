import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './providers/AppProviders';
import '../styles/index.css';
import App from '../App';


// вспомогательная функция для рендера — экспортируемая для тестов/SSR
export function renderApp(rootEl: HTMLElement) {
  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </React.StrictMode>
  );
}
// bootstrap может быть async, если нужно дождаться init сервисов
export async function bootstrap() {
  // например, инициализация feature flags, analytics, конфигурации
  // await initFeatureFlags();
  // initAnalytics();
  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('Root element not found');
  renderApp(rootEl);
}