'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  animated?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', animated = false, onClick }: GlassCardProps) {
  const base = animated ? 'glass-card animated-border cursor-pointer' : 'glass-card';
  return (
    <div className={`${base} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
