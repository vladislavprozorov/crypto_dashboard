/**
 * @copyright vladislavprozorov
 */

import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_COINGECKO_API || 'https://api.coingecko.com/api/v3';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/** Request interceptor:
 *  - добавить auth header если есть токен
 *  - можно логировать запросы
 */
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore (например, в SSR localStorage не доступен)
    }
    // безопасное логирование
    if (import.meta.env.DEV) {
      const params = config.params ? safeStringify(config.params) : '';
      console.debug('[API request]', config.method, config.url, params);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/** Response interceptor:
 *  - можно трансформировать ошибки
 *  - можно вернуть res.data напрямую (но я оставлю структуру стандартной)
 */
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      // логируем только размер данных или статус
      const info = response?.data
        ? { size: Object.keys(response.data).length }
        : (response?.status ?? safeStringify(response));
      console.debug('[API response]', response.config?.url, info);
    }
    return response;
  },
  (error: AxiosError) => {
    // Простая унификация ошибки
    const status = error.response?.status;
    const serverMessage =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error.response?.data as any)?.error ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error.response?.data as any)?.message;
    const msg =
      serverMessage ||
      (status ? `Request failed with status ${status}` : error.message || 'Network Error');

    // Можно создавать кастомный Error-класс, но для простоты:
    const e = new Error(msg);
    return Promise.reject(e);
  },
);

function safeStringify(obj: unknown) {
  try {
    const seen = new WeakSet();
    return JSON.stringify(
      obj,
      (_, v) => {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        return v;
      },
      2,
    );
  } catch {
    return String(obj);
  }
}

export default api;
