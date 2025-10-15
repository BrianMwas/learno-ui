'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

type LearningContextType = ReturnType<typeof useWebSocket>;

const LearningContext = createContext<LearningContextType | null>(null);

export const LearningProvider = ({ children }: { children: ReactNode }) => {
  const learning = useWebSocket();
  return <LearningContext.Provider value={learning}>{children}</LearningContext.Provider>;
};

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};
