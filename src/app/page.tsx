'use client';

import { useState, useCallback } from 'react';
import { Lang, getLangFromStorage, t } from '@/lib/i18n';
import Header from '@/components/layout/Header';
import AgentStatus from '@/components/dashboard/AgentStatus';
import PriceCard from '@/components/dashboard/PriceCard';
import DecisionFeed from '@/components/dashboard/DecisionFeed';
import ActivityLog from '@/components/dashboard/ActivityLog';

interface ActivityEntry {
  type: 'price' | 'analysis' | 'decision';
  asset: string;
  detail: string;
  time: string;
}

interface PriceState {
  price: number;
  change24h: number;
}

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>(getLangFromStorage);

  // Simulated prices — replace with on-chain data from Ritual HTTP precompile
  const [prices, setPrices] = useState<Record<string, PriceState>>({
    BTC: { price: 67234.50, change24h: 2.34 },
    ETH: { price: 3241.89, change24h: -0.87 },
    SOL: { price: 172.45, change24h: 5.12 },
  });

  const [activityLog] = useState<ActivityEntry[]>([
    { type: 'price',    asset: 'BTC', detail: 'Price fetched: $67,234.50 via Ritual HTTP Precompile (0x0801)', time: '2 min ago' },
    { type: 'analysis', asset: 'BTC', detail: 'LLM analysis requested via Precompile (0x0802)', time: '2 min ago' },
    { type: 'decision', asset: 'BTC', detail: 'Agent decided: HOLD — price trading within range', time: '1 min ago' },
    { type: 'price',    asset: 'ETH', detail: 'Price fetched: $3,241.89 via Ritual HTTP Precompile (0x0801)', time: '5 min ago' },
    { type: 'price',    asset: 'SOL', detail: 'Price fetched: $172.45 via Ritual HTTP Precompile (0x0801)', time: '8 min ago' },
  ]);

  const handleFetchPrice = useCallback((asset: string) => {
    // Simulate price fetch — in production, calls contract.fetchPrice(assetId)
    const variation = (Math.random() - 0.5) * 2; // ±1%
    setPrices((prev) => {
      const current = prev[asset];
      if (!current) return prev;
      const newPrice = current.price * (1 + variation / 100);
      const newChange = current.change24h + (Math.random() - 0.5) * 0.5;
      return { ...prev, [asset]: { price: newPrice, change24h: newChange } };
    });
  }, []);

  // Demo decisions
  const demoDecisions = [
    {
      id: 2,
      asset: 1, // BTC
      decision: 3, // HOLD
      price: 67234.50,
      timestamp: Math.floor(Date.now() / 1000) - 60,
      reasoning: 'BTC is trading near the 50-day EMA with decreasing volume. RSI reads 58 — no overbought or oversold signal. The lack of a clear catalyst and range-bound structure suggest holding current position. Wait for a breakout above $69K or breakdown below $64K before entering.',
    },
    {
      id: 1,
      asset: 3, // SOL
      decision: 1, // BUY
      price: 168.20,
      timestamp: Math.floor(Date.now() / 1000) - 3600,
      reasoning: 'SOL shows bullish divergence on the 4-hour chart with RSI recovering from 42. Volume profile indicates accumulation above $160. Network activity increasing — daily active addresses up 12%. Upside target at $185 with invalidation below $155.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header lang={lang} onLangChange={setLang} />

      <main className="dashboard-grid animate-in">
        {/* Agent Status — full width */}
        <div className="col-span-3">
          <AgentStatus lang={lang} />
        </div>

        {/* 3 Price Cards */}
        <PriceCard lang={lang} asset="BTC" data={prices.BTC} onFetch={handleFetchPrice} />
        <PriceCard lang={lang} asset="ETH" data={prices.ETH} onFetch={handleFetchPrice} />
        <PriceCard lang={lang} asset="SOL" data={prices.SOL} onFetch={handleFetchPrice} />

        {/* Decision Feed — spans 2 cols */}
        <div className="col-span-2">
          <DecisionFeed lang={lang} decisions={demoDecisions} />
        </div>

        {/* Activity Log */}
        <ActivityLog lang={lang} entries={activityLog} />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <span>{t('footer.built', lang)} · {t('footer.powered', lang)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent-violet)',
            display: 'inline-block',
          }} />
          {t('footer.chain', lang)}
        </span>
      </footer>
    </div>
  );
}
