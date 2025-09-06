/**
 * @copyright vladislavprozorov
 */

import axios, { AxiosError } from 'axios';

// const API_URL =
//   import.meta.env.VITE_COINGECKO_API || 'https://api.coingecko.com/api/v3';

const api = axios.create({
  baseURL: '/api',
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
    // простое логирование
    if (import.meta.env.DEV) {
      console.debug('[API request]', config.method, config.url, config.params ?? '');
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
  (response) => response,
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

export default api;
