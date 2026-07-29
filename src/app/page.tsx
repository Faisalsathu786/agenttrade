'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lang, getLangFromStorage, t } from '@/lib/i18n';
import Header from '@/components/layout/Header';
import AgentStatus from '@/components/dashboard/AgentStatus';
import PriceCard from '@/components/dashboard/PriceCard';
import DecisionFeed from '@/components/dashboard/DecisionFeed';
import ActivityLog from '@/components/dashboard/ActivityLog';

const COINGECKO_IDS: Record<string, string> = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana' };

const LOGOS: Record<string, string> = {
  BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  SOL: 'https://cryptologos.cc/logos/solana-sol-logo.png',
};

const COLORS: Record<string, string> = {
  BTC: '#f7931a',
  ETH: '#627eea',
  SOL: '#9945ff',
};

interface ActivityEntry {
  type: 'price' | 'analysis' | 'decision';
  asset: string;
  detail: string;
  time: string;
}

interface PriceData {
  price: number;
  change24h: number;
}

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>(getLangFromStorage);
  const [prices, setPrices] = useState<Record<string, PriceData | null>>({ BTC: null, ETH: null, SOL: null });
  const [loading, setLoading] = useState(true);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([
    { type: 'decision', asset: 'system', detail: 'AgentTrade V1 deployed on Ritual Chain (testnet)', time: '30 min ago' },
    { type: 'price', asset: 'system', detail: 'Contract 0x27ecB...499843 registered', time: '15 min ago' },
  ]);

  // Fetch live prices from CoinGecko
  const fetchPrices = useCallback(async () => {
    try {
      const ids = Object.values(COINGECKO_IDS).join(',');
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        { next: { revalidate: 60 } }
      );
      const data = await res.json();
      const newPrices: Record<string, PriceData | null> = {};
      for (const [key, cgId] of Object.entries(COINGECKO_IDS)) {
        const coin = data[cgId];
        if (coin) {
          newPrices[key] = { price: coin.usd, change24h: coin.usd_24h_change ?? 0 };
        }
      }
      setPrices((prev) => ({ ...prev, ...newPrices }));
      setLoading(false);
    } catch {
      // Retry on next interval
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const handleFetchPrice = useCallback((asset: string) => {
    setActivityLog((prev) => [
      { type: 'price', asset, detail: `Price fetch triggered for ${asset}`, time: 'just now' },
      ...prev.slice(0, 19),
    ]);
    // In production: calls contract.fetchPrice(assetId) on Ritual Chain
    const coingeckoId = COINGECKO_IDS[asset];
    if (coingeckoId) {
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`)
        .then((r) => r.json())
        .then((data) => {
          const coin = data[coingeckoId];
          if (coin) {
            setPrices((prev) => ({ ...prev, [asset]: { price: coin.usd, change24h: coin.usd_24h_change ?? 0 } }));
            const priceStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(coin.usd);
            setActivityLog((prev) => [
              { type: 'price', asset, detail: `${asset} price updated: ${priceStr} (via CoinGecko)`, time: 'just now' },
              ...prev.slice(0, 19),
            ]);
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header lang={lang} onLangChange={setLang} />

      <main className="dashboard-grid animate-in">
        {/* Agent Status — full width */}
        <div className="col-span-3">
          <AgentStatus lang={lang} />
        </div>

        {/* 3 Price Cards — LIVE from CoinGecko */}
        {(['BTC', 'ETH', 'SOL'] as const).map((asset) => (
          <PriceCard
            key={asset}
            lang={lang}
            asset={asset}
            data={prices[asset]}
            logoUrl={LOGOS[asset]}
            accentColor={COLORS[asset]}
            loading={loading}
            onFetch={handleFetchPrice}
          />
        ))}

        {/* How It Works — explainer card */}
        <div className="col-span-3">
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 className="section-title" style={{ marginBottom: 16, color: 'var(--accent-violet)' }}>
              ⚡ How AgentTrade Works
            </h3>
            <div className="how-grid">
              <div className="how-step">
                <div className="how-step-num">1</div>
                <h4>HTTP Precompile</h4>
                <p className="caption">Smart contract fetches live prices from CoinGecko via Ritual&apos;s HTTP precompile (0x0801) — no oracle needed. TEE-verified.</p>
              </div>
              <div className="how-step">
                <div className="how-step-num">2</div>
                <h4>LLM Analysis</h4>
                <p className="caption">AI evaluates market data via LLM precompile (0x0802) — combines price action, RSI, volume, and trend structure into a trade decision.</p>
              </div>
              <div className="how-step">
                <div className="how-step-num">3</div>
                <h4>On-Chain Decision</h4>
                <p className="caption">BUY / SELL / HOLD decision stored on-chain. Fully auditable — every price feed, every analysis, every trade decision is verifiable.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decision Feed */}
        <div className="col-span-2">
          <DecisionFeed lang={lang} />
        </div>

        {/* Activity Log */}
        <ActivityLog lang={lang} entries={activityLog} />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <span>{t('footer.built', lang)} · Ritual Chain (testnet)</span>
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
