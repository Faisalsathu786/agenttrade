'use client';

import { useState, useEffect } from 'react';
import { Lang, t } from '@/lib/i18n';

interface AdaptionInfo {
  dataset_id: string;
  run_id: string;
  rows: number;
  symbols: string[];
  status: string;
  minutes_est: number;
  credits_est: number;
  dashboard_url: string;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  totalPredictions: number;
  lastUpdated: string;
}

export default function AdaptionAIPanel({ lang }: { lang: Lang }) {
  const [info, setInfo] = useState<AdaptionInfo | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    fetch('/data/adaption_info.json')
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, []);

  // Countdown timer for training
  useEffect(() => {
    if (!info || info.status !== 'running') return;
    const startedAt = Date.now() - 5000; // approximate
    const totalMs = (info.minutes_est || 58) * 60 * 1000;
    
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, totalMs - elapsed);
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}m ${secs}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [info]);

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: expanded ? 16 : 0 }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>🧠</div>
        <div style={{ flex: 1 }}>
          <div className="h3" style={{ margin: 0 }}>Adaption AI</div>
          <div className="caption" style={{ margin: 0 }}>
            {info ? (
              info.status === 'running'
                ? `Training... ${timeLeft} remaining`
                : info.status === 'succeeded'
                ? 'Model ready ✓'
                : 'Pending...'
            ) : 'Not connected'}
          </div>
        </div>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: info?.status === 'running' ? 'var(--accent-violet)' :
                      info?.status === 'succeeded' ? '#22c55e' :
                      '#6b7280',
          boxShadow: info?.status === 'running'
            ? '0 0 8px rgba(99,102,241,.6)'
            : 'none',
          animation: info?.status === 'running' ? 'pulse 2s infinite' : 'none',
        }} />
      </div>

      {expanded && info && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="divider" />

          {/* Dataset info */}
          <div className="metrics-row">
            <div className="metric-item">
              <div className="caption">Dataset</div>
              <div className="mono" style={{ fontSize: 13 }}>{info.dataset_id.slice(0, 8)}...</div>
            </div>
            <div className="metric-item">
              <div className="caption">Rows</div>
              <div className="mono">{info.rows.toLocaleString()}</div>
            </div>
            <div className="metric-item">
              <div className="caption">Assets</div>
              <div className="mono">{info.symbols.join('·')}</div>
            </div>
          </div>

          {/* Training progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="caption">Training Progress</span>
              <span className="caption mono">{timeLeft || '—'}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: '45%',
                background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                animation: 'progressPulse 2s infinite',
              }} />
            </div>
          </div>

          {/* Model info */}
          <div style={{ background: 'rgba(99,102,241,.1)', borderRadius: 8, padding: '12px' }}>
            <div className="caption" style={{ marginBottom: 6 }}>AutoScientist: Price → Decision</div>
            <div className="metrics-row">
              <div className="metric-item">
                <div className="caption">Est. Cost</div>
                <div className="mono">38 credits</div>
              </div>
              <div className="metric-item">
                <div className="caption">Est. Time</div>
                <div className="mono">~58 min</div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={info.dashboard_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline"
              style={{ flex: 1, textAlign: 'center' }}
            >
              Open Adaption Dashboard ↗
            </a>
          </div>

          <div className="caption" style={{ color: 'var(--text-dim)', lineHeight: 1.4, marginTop: 4 }}>
            Training on {info.rows.toLocaleString()} rows of BTC, ETH, SOL hourly data.
            Model learns to predict {t('agent.decision', lang)} (BULLISH/BEARISH/HOLD)
            from price, RSI, SMA crossovers.
          </div>
        </div>
      )}
    </div>
  );
}
