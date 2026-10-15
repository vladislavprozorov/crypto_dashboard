export type NotifyPermission = NotificationPermission | 'unsupported';

export function notificationPermission(): NotifyPermission {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/** Запрашивать только по действию пользователя — иначе браузер молча откажет. */
export async function requestNotifications(): Promise<NotifyPermission> {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function systemNotify(title: string, body: string) {
  if (notificationPermission() !== 'granted') return;
  try {
    new Notification(title, { body, tag: title });
  } catch {
    // мобильный Chrome умеет уведомления только через service worker — там хватит тоста
  }
}
