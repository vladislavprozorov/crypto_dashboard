import React from 'react';

const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="container mx-auto px-4">{children}</main>
);

export default PageLayout;
