import { bootstrap } from './app/bootstrap';
import { reportWebVitals } from './shared/lib/web-vitals';

bootstrap().then(() => {
  reportWebVitals(console.log);
});
