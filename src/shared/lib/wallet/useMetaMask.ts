import { useState } from 'react';

export function useMetaMask() {
  const [account, setAccount] = useState<string | null>(null);

  async function connect() {
    if ((window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (e) {
        setAccount(null);
      }
    }
  }

  return { account, connect };
}
