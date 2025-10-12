import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

export const Toast: React.FC<{
  message: unknown;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}> = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const color =
    type === 'success' ? 'bg-lime-600' : type === 'error' ? 'bg-pink-600' : 'bg-cyan-700';
  const Icon =
    type === 'success' ? FaCheckCircle : type === 'error' ? FaExclamationCircle : FaInfoCircle;

  // Безопасное преобразование message к строке
  let text: string;
  if (typeof message === 'string') {
    text = message;
  } else if (typeof message === 'number') {
    text = String(message);
  } else if (typeof message === 'object') {
    try {
      text = JSON.stringify(message);
    } catch {
      text = '[object]';
    }
  } else {
    text = String(message ?? '');
  }

  return (
    <div
      className={`fixed top-6 right-6 px-6 py-3 rounded shadow-lg text-white flex items-center gap-2 ${color} animate-fade-in z-50`}
    >
      <Icon />
      <span>{text}</span>
    </div>
  );
};
