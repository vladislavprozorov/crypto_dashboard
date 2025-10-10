import React, { Suspense } from "react";
import { ErrorBoundary, Loader } from "./shared/ui";

const LazyAppRouter = React.lazy(() => import("./app/router/AppRouter"));

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        <LazyAppRouter />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
