'use client';

import { Lang, t } from '@/lib/i18n';

const demoDecisions = [
  {
    id: 2, asset: 'BTC', decision: 'HOLD', price: '63,732',
    timestamp: '2 min ago',
    reasoning: 'BTC at $63,732 — RSI 54, no clear breakout. HTTP precompile fetched live price from CoinGecko. Agent HOLDs until breakout above $69K or dip below $64K.',
    confidence: 'medium',
  },
  {
    id: 1, asset: 'SOL', decision: 'BUY', price: '172.49',
    timestamp: '30 min ago',
    reasoning: 'SOL — bullish divergence on 4H, accumulation above $160. Daily active addresses up 12%. Entry signaled.',
    confidence: 'high',
  },
];

interface DecisionFeedProps {
  lang: Lang;
}

export default function DecisionFeed({ lang }: DecisionFeedProps) {
  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <h3 className="h3" style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        {'\u{1F9E0}'} AI Trade Decisions
      </h3>

      {demoDecisions.map((d) => {
        const cls = d.decision === 'BUY' ? 'decision-buy' : d.decision === 'SELL' ? 'decision-sell' : 'decision-hold';
        return (
          <div key={d.id} style={{
            padding: '12px 0',
            borderBottom: '1px solid var(--glass-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className={`decision-label ${cls}`}>{d.decision}</span>
              <span className="body" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.asset}</span>
              <span className="caption">{'\u{1F4B0} '}${d.price}</span>
              <span className="caption" style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>{d.timestamp}</span>
            </div>
            <p className="caption" style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {d.reasoning}
            </p>
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
          {'\u{1F4E1}'} Contract: 0x27ec...499843 · Ritual Chain (testnet)
        </div>
        <div className="caption" style={{ color: 'var(--text-dim)', marginTop: 4 }}>
          {'\u{26A1}'} HTTP Precompile (0x0801) fetching prices · LLM Precompile (0x0802) analyzing
        </div>
      </div>
    </div>
  );
}
