import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentTrade — Autonomous Trading Agent on Ritual Chain',
  description: 'The first autonomous trading agent on Ritual Chain. On-chain price data, AI-powered analysis, fully transparent decisions.',
  openGraph: {
    title: 'AgentTrade — Autonomous Trading Agent',
    description: 'On-chain AI trading agent built on Ritual Chain precompiles.',
    type: 'website',
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%230a0a0f"/><polyline points="28 16 23 16 20 28 12 4 8 16 4 16" fill="none" stroke="%23c4a96a" stroke-width="2.5" stroke-linecap="round"/></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
        {children}
      </body>
    </html>
  );
}
