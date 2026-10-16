import { AnimatePresence, motion } from 'framer-motion';
import { CloseIcon } from './icons';
import { dismissToast, useToasts } from '../lib/toast';

export function Toaster() {
  const list = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[88px] z-50 flex flex-col items-end gap-2 md:bottom-6 md:left-auto md:right-6"
    >
      <AnimatePresence initial={false}>
        {list.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.18 }}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 p-4 ${
              t.tone === 'accent' ? 'bg-accent text-on-ink' : 'bg-ink text-on-ink'
            }`}
            role="status"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium">{t.title}</div>
              {t.body && <div className="num mt-1 text-xs opacity-80">{t.body}</div>}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Закрыть уведомление"
              className="-m-2 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center opacity-70 hover:opacity-100"
            >
              <CloseIcon size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
