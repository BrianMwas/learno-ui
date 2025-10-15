'use client';

import { ReactNode } from 'react';

interface TextAnimateProps {
  children: ReactNode;
  className?: string;
}

export function TextAnimate({ children, className = '' }: TextAnimateProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}
