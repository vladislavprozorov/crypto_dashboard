import AppRouter from "./app/router/AppRouter";
import Dashboard from "./pages/DashBoard/DashBoard";
import { ErrorBoundary } from "./shared/ui";

function App() {
  return (
    <ErrorBoundary>
 
        <Dashboard/>
     
    </ErrorBoundary>
  );
}

export default App;
