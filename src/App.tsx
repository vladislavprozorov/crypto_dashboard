import { Suspense, lazy } from 'react';
import { Loader } from './shared/ui/Loader';
import { ErrorBoundary } from './shared/ui/ErrorBoundary';
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
