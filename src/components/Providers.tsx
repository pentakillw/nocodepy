'use client';

import React from 'react';
import { DataProvider } from '@/context/DataContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      {children}
    </DataProvider>
  );
}