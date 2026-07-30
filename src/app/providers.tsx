'use client';

import { WalletProvider } from '@/lib/providers';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
