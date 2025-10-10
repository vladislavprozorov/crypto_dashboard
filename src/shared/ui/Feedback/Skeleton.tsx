import React from 'react';

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-gray-700/30 animate-pulse rounded ${className ?? ''}`} />
);

export default Skeleton;
