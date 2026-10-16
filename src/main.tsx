import { bootstrap } from './app/bootstrap';
import { reportWebVitals } from './shared/lib/web-vitals';

bootstrap().then(() => {
  if (import.meta.env.DEV) reportWebVitals(console.log);
});
