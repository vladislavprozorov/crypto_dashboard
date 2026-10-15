import { memo } from 'react';
import { downsample, sparklinePath } from '../lib/sparkline';

export const Sparkline = memo(function Sparkline({
  values,
  width = 96,
  height = 28,
  className = 'text-ink',
}: {
  values: number[] | undefined;
  width?: number;
  height?: number;
  className?: string;
}) {
  const d = values ? sparklinePath(downsample(values, 48), width, height) : '';
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      {d && <path d={d} fill="none" stroke="currentColor" strokeWidth={1.25} />}
    </svg>
  );
});
