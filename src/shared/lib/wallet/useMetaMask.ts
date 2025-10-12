import { useState } from 'react';
import type { MetaMaskInpageProvider } from '@metamask/providers';

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}

export function useMetaMask() {
  const [account, setAccount] = useState<string | null>(null);

  async function connect() {
    const provider = window.ethereum;
    if (!provider) return;

    try {
      // request возвращает неизвестный тип, приводим к unknown и затем проверяем
      const result = (await provider.request({ method: 'eth_requestAccounts' })) as unknown;

      // безопасно проверяем, что это массив строк и в нём есть первый элемент
      if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'string') {
        setAccount(result[0]);
      } else {
        // если результат не тот, что ожидали — сбрасываем
        setAccount(null);
      }
    } catch {
      // не объявляем переменную err, чтобы ESLint не жаловался на неиспользуемую
      setAccount(null);
    }
  }

  return { account, connect };
}
