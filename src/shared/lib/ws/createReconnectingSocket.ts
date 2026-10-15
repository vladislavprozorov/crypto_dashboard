export type SocketStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';

export interface ReconnectingSocketOptions {
  url: string;
  onMessage: (data: string) => void;
  onStatus?: (status: SocketStatus) => void;
  /** Начальная задержка переподключения, мс */
  minDelay?: number;
  /** Потолок задержки, мс */
  maxDelay?: number;
  /** Подключаемся заново, если сервер молчит дольше этого времени, мс */
  idleTimeout?: number;
  createSocket?: (url: string) => WebSocket;
}

/** Задержка перед попыткой n: экспонента с «джиттером», чтобы клиенты не ломились синхронно. */
export function backoffDelay(
  attempt: number,
  minDelay = 1000,
  maxDelay = 30000,
  random = Math.random,
) {
  const exp = Math.min(maxDelay, minDelay * 2 ** attempt);
  return Math.round(exp / 2 + random() * (exp / 2));
}

/**
 * WebSocket, который сам переподключается: экспоненциальная задержка,
 * сторожевой таймер на «тихое» соединение, пауза при потере сети.
 */
export function createReconnectingSocket(options: ReconnectingSocketOptions) {
  const {
    url,
    onMessage,
    onStatus,
    minDelay = 1000,
    maxDelay = 30000,
    idleTimeout = 20000,
    createSocket = (u) => new WebSocket(u),
  } = options;

  let socket: WebSocket | null = null;
  let attempt = 0;
  let closed = false;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  const setStatus = (s: SocketStatus) => onStatus?.(s);

  const armIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => socket?.close(), idleTimeout);
  };

  const scheduleReconnect = () => {
    if (closed) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus('offline');
      return;
    }
    setStatus('reconnecting');
    clearTimeout(retryTimer);
    retryTimer = setTimeout(connect, backoffDelay(attempt++, minDelay, maxDelay));
  };

  function connect() {
    if (closed) return;
    setStatus(attempt === 0 ? 'connecting' : 'reconnecting');
    try {
      socket = createSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }
    socket.onopen = () => {
      attempt = 0;
      setStatus('live');
      armIdle();
    };
    socket.onmessage = (event) => {
      armIdle();
      onMessage(typeof event.data === 'string' ? event.data : String(event.data));
    };
    socket.onclose = () => {
      clearTimeout(idleTimer);
      socket = null;
      scheduleReconnect();
    };
    socket.onerror = () => socket?.close();
  }

  const onOnline = () => {
    if (!socket && !closed) {
      attempt = 0;
      clearTimeout(retryTimer);
      connect();
    }
  };
  const onOffline = () => setStatus('offline');

  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
  }

  connect();

  return {
    close() {
      closed = true;
      clearTimeout(retryTimer);
      clearTimeout(idleTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      }
      if (socket) {
        socket.onclose = null;
        socket.close();
        socket = null;
      }
    },
  };
}
