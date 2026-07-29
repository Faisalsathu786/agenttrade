'use client';

import { Box, ArrowRight, Database, Globe, LineChart } from 'lucide-react';

const LAYERS = [
  {
    title: 'Smart Contract',
    subtitle: 'Ritual Chain · Solidity',
    detail: 'On-chain decision engine stores every analysis immutably. HTTP precompile fetches live prices without oracles.',
    icon: Box,
    color: '#7C3AED',
  },
  {
    title: 'Auto-Agent',
    subtitle: 'Cron Engine · Every 12 min',
    detail: 'Autonomous agent fetches prices, computes indicators, records BULLISH/BEARISH/HOLD decisions on-chain.',
    icon: LineChart,
    color: '#2563EB',
  },
  {
    title: 'AI Model',
    subtitle: 'Adaption AutoScientist',
    detail: 'Trained on 3,767 rows of hourly BTC/ETH/SOL data with RSI, SMA, and price action features.',
    icon: Database,
    color: '#22C55E',
  },
  {
    title: 'Dashboard',
    subtitle: 'Next.js · Real-time',
    detail: 'Live market data, on-chain decisions, AI model status, and research assistant in a single interface.',
    icon: Globe,
    color: '#F59E0B',
  },
];

export default function ArchitectureOverview() {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Architecture</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {LAYERS.map((layer, i) => (
          <div key={layer.title}>
            <div style={{ display: 'flex', gap: 12, padding: '10px 0' }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: 8,
                background: `${layer.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: layer.color,
                flexShrink: 0,
              }}>
                <layer.icon size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{layer.title}</div>
                <div className="caption">{layer.subtitle}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  {layer.detail}
                </div>
              </div>
            </div>
            {i < LAYERS.length - 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
