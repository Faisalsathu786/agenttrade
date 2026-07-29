'use client';

import { useState, useEffect } from 'react';
import { Cpu, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';

interface AdaptionInfo {
  dataset_id: string;
  run_id: string;
  rows: number;
  symbols: string[];
  status: string;
  minutes_est: number;
  credits_est: number;
  dashboard_url: string;
  ready?: boolean;
}

export default function AdaptionAI() {
  const [info, setInfo] = useState<AdaptionInfo | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/data/adaption_info.json')
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, []);

  const isReady = info?.ready || info?.status === 'succeeded';
  const isRunning = info?.status === 'running';

  return (
    <div className="card">
      <div className="card-header" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer', marginBottom: expanded ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: isReady ? 'var(--success-dim)' : 'var(--primary-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isReady ? 'var(--success)' : 'var(--primary)',
          }}>
            <Cpu size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Adaption AI Model</div>
            <div className="caption">
              {isReady ? 'Trained · Ready' : isRunning ? 'Training in progress...' : 'Not connected'}
            </div>
          </div>
        </div>
        <span className={`badge ${isReady ? 'badge-success' : isRunning ? 'badge-primary' : 'badge-warning'}`}>
          {isReady ? <CheckCircle2 size={12} /> : isRunning ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {isReady ? 'Ready' : isRunning ? 'Training' : 'Pending'}
        </span>
      </div>

      {expanded && info && (
        <div>
          <div className="divider" />

          <div className="metrics-row" style={{ marginBottom: 14 }}>
            <div className="metric-item" style={{ flex: 1 }}>
              <div className="metric-label">Dataset</div>
              <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>
                {info.dataset_id.slice(0, 12)}...
              </div>
            </div>
            <div className="metric-item" style={{ flex: 1 }}>
              <div className="metric-label">Training Rows</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{info.rows.toLocaleString()}</div>
            </div>
            <div className="metric-item" style={{ flex: 1 }}>
              <div className="metric-label">Assets</div>
              <div style={{ fontWeight: 500, fontSize: '0.8rem' }}>{info.symbols.join(', ')}</div>
            </div>
            <div className="metric-item" style={{ flex: 1 }}>
              <div className="metric-label">Credits Used</div>
              <div style={{ fontWeight: 500, fontSize: '0.8rem' }}>{info.credits_est}</div>
            </div>
          </div>

          {isReady && (
            <div style={{
              background: 'var(--success-dim)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 8,
              padding: 10,
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--success)' }}>
                  Model training complete — ready for inference
                </span>
              </div>
            </div>
          )}

          <a
            href={info.dashboard_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
            style={{ width: '100%' }}
          >
            <ExternalLink size={12} />
            Adaption Dashboard
          </a>
        </div>
      )}
    </div>
  );
}
