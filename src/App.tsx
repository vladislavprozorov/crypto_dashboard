import { Suspense, lazy } from 'react';
import { Loader, ErrorBoundary } from './shared/ui';
const DashBoard = lazy(() => import('./pages/DashBoard/DashBoard'));
import './styles/index.css';
function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        <DashBoard />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
