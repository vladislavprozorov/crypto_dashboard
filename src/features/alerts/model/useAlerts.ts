import { useCallback } from 'react';
import {
  readStored,
  useStoredState,
  writeStored,
} from '../../../shared/lib/storage/useStoredState';
import { createAlert, type NewAlert, type PriceAlert } from './alerts';

export const ALERTS_KEY = 'alerts:v1';
const EMPTY: PriceAlert[] = [];

export function readAlerts() {
  return readStored<PriceAlert[]>(ALERTS_KEY, EMPTY);
}

export function writeAlerts(alerts: PriceAlert[]) {
  writeStored(ALERTS_KEY, alerts);
}

export function useAlerts() {
  const [alerts, setAlerts] = useStoredState<PriceAlert[]>(ALERTS_KEY, EMPTY);

  const add = useCallback(
    (input: NewAlert) => {
      const alert = createAlert(input);
      setAlerts((prev) => [alert, ...prev]);
      return alert;
    },
    [setAlerts],
  );
  const remove = useCallback(
    (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id)),
    [setAlerts],
  );
  const clearTriggered = useCallback(
    () => setAlerts((prev) => prev.filter((a) => a.triggeredAt == null)),
    [setAlerts],
  );

  return { alerts, add, remove, clearTriggered };
}
