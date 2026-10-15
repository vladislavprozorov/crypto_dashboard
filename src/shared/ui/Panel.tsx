import type { ReactNode } from 'react';

/** Плоская секция с заголовком-линейкой — основной контейнер интерфейса. */
export function Panel({
  title,
  aside,
  children,
  className = '',
  id,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section aria-labelledby={headingId} className={`panel ${className}`}>
      {title && (
        <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-2">
          <h2 id={headingId} className="panel-title">
            {title}
          </h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
