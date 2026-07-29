'use client';

import { Lang, t } from '@/lib/i18n';

export interface DecisionData {
  asset: string;
  assetId: number;
  price: number;
  direction: string;
  directionNum: number;
  confidence: number;
  timestamp: number;
  age: number;
}

interface DecisionFeedProps {
  lang: Lang;
  decisions: DecisionData[];
  loading: boolean;
  error: string | null;
}

const ASSET_COLORS: Record<string, string> = {
  BTC: '#f7931a',
  ETH: '#627eea',
  SOL: '#00ffa3',
};

export default function DecisionFeed({ lang, decisions, loading, error }: DecisionFeedProps) {
  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <h3 className="h3" style={{ margin: '0 0 16px 0' }}>
        AI Trade Decisions
      </h3>

      {loading && (
        <div className="caption" style={{ color: 'var(--text-dim)', padding: '20px 0', textAlign: 'center' }}>
          Loading on-chain decisions...
        </div>
      )}

      {error && (
        <div className="caption" style={{ color: 'var(--danger-red)', padding: '12px 0' }}>
          {error}
        </div>
      )}

      {!loading && !error && decisions.length === 0 && (
        <div className="caption" style={{ color: 'var(--text-dim)', padding: '20px 0', textAlign: 'center' }}>
          No decisions yet — agent needs price data first
        </div>
      )}

      {decisions.map((d, i) => {
        const dirCls = d.direction === 'BULLISH' ? 'decision-buy' : d.direction === 'BEARISH' ? 'decision-sell' : 'decision-hold';
        const assetColor = ASSET_COLORS[d.asset] || '#aaa';
        return (
          <div key={i} style={{
            padding: '12px 0',
            borderBottom: '1px solid var(--glass-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className={`decision-label ${dirCls}`}>{d.direction}</span>
              <span className="body" style={{ fontWeight: 600, color: assetColor }}>{d.asset}</span>
              <span className="caption">${d.price.toLocaleString()}</span>
              <span className="caption" style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>
                {d.age < 1 ? 'just now' : `${d.age}m ago`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span className="caption" style={{ color: 'var(--text-secondary)' }}>
                Confidence: {d.confidence}%
              </span>
              <span className="caption" style={{ color: 'var(--text-dim)' }}>
                Block: on-chain verified
              </span>
            </div>
          </div>
        );
      })}

      {/* Contract info */}
      <div style={{
        marginTop: 16,
        padding: '12px 16px',
        background: 'rgba(172, 170, 255, 0.08)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(172, 170, 255, 0.15)',
      }}>
        <div className="caption" style={{ color: 'var(--accent-violet)' }}>
          Contract: 0x8bD4...E2cB · Ritual Chain (testnet)
        </div>
        <div className="caption" style={{ color: 'var(--text-dim)', marginTop: 4 }}>
          Decisions stored on-chain · Fully auditable · No off-chain oracle
        </div>
      </div>
    </div>
  );
}
