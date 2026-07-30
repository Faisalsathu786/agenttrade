'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const ritualChain = {
  id: 1979,
  name: 'Ritual Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ritualfoundation.org'] },
    public: { http: ['https://rpc.ritualfoundation.org'] },
  },
  blockExplorers: {
    default: { name: 'Ritual Explorer', url: 'https://explorer.ritualfoundation.org' },
  },
} as const;

export const wagmiConfig = createConfig({
  chains: [ritualChain],
  transports: {
    [ritualChain.id]: http('https://rpc.ritualfoundation.org'),
  },
  connectors: [injected()],
  ssr: true,
});

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
