import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  backoffDelay,
  createReconnectingSocket,
  type SocketStatus,
} from '../ws/createReconnectingSocket';

class FakeSocket {
  static instances: FakeSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  url: string;
  constructor(url: string) {
    this.url = url;
    FakeSocket.instances.push(this);
  }
  close() {
    this.closed = true;
    this.onclose?.();
  }
}

describe('backoffDelay', () => {
  test('растёт экспоненциально и упирается в потолок', () => {
    const max = () => 1;
    expect(backoffDelay(0, 1000, 30000, max)).toBe(1000);
    expect(backoffDelay(3, 1000, 30000, max)).toBe(8000);
    expect(backoffDelay(10, 1000, 30000, max)).toBe(30000);
  });
  test('джиттер — не меньше половины', () => {
    expect(backoffDelay(2, 1000, 30000, () => 0)).toBe(2000);
  });
});

describe('createReconnectingSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeSocket.instances = [];
  });
  afterEach(() => vi.useRealTimers());

  const setup = () => {
    const statuses: SocketStatus[] = [];
    const messages: string[] = [];
    const s = createReconnectingSocket({
      url: 'wss://x',
      onMessage: (m) => messages.push(m),
      onStatus: (st) => statuses.push(st),
      idleTimeout: 5000,
      createSocket: (u) => new FakeSocket(u) as unknown as WebSocket,
    });
    return { s, statuses, messages };
  };

  test('подключается, принимает сообщения и переподключается после обрыва', () => {
    const { s, statuses, messages } = setup();
    const first = FakeSocket.instances[0];
    first.onopen?.();
    first.onmessage?.({ data: 'hello' });
    expect(messages).toEqual(['hello']);
    expect(statuses).toEqual(['connecting', 'live']);

    first.close();
    expect(statuses.at(-1)).toBe('reconnecting');
    vi.advanceTimersByTime(1000);
    expect(FakeSocket.instances).toHaveLength(2);
    s.close();
  });

  test('сторожевой таймер рвёт «тихое» соединение', () => {
    const { s } = setup();
    const first = FakeSocket.instances[0];
    first.onopen?.();
    vi.advanceTimersByTime(5001);
    expect(first.closed).toBe(true);
    s.close();
  });

  test('close() останавливает переподключения', () => {
    const { s } = setup();
    s.close();
    vi.advanceTimersByTime(60_000);
    expect(FakeSocket.instances).toHaveLength(1);
  });
});
