'use client';

import { Activity, Zap, Clock, Hash } from 'lucide-react';

interface AgentStatusProps {
  totalDecisions: number;
  active: boolean;
  lastActivityBlock: number | null;
}

export default function AgentStatus({ totalDecisions, active, lastActivityBlock }: AgentStatusProps) {
  const uptimeDisplay = lastActivityBlock
    ? `Block #${lastActivityBlock.toLocaleString()}`
    : '—';

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Agent Status</span>
        <span className={`badge ${active ? 'badge-success' : 'badge-warning'}`}>
          <div className={`status-dot ${active ? 'live' : 'idle'}`} style={{ width: 5, height: 5 }} />
          {active ? 'Active' : 'Idle'}
        </span>
      </div>

      <div className="metrics-row">
        <div className="metric-item" style={{ flex: 1 }}>
          <div className="metric-value">{totalDecisions > 0 ? totalDecisions : '—'}</div>
          <div className="metric-label">Decisions</div>
        </div>
        <div className="metric-item" style={{ flex: 1 }}>
          <div className="metric-value">{uptimeDisplay}</div>
          <div className="metric-label">Last Activity</div>
        </div>
        <div className="metric-item" style={{ flex: 1 }}>
          <div className="metric-value" style={{ color: 'var(--text-muted)' }}>—</div>
          <div className="metric-label">Performance</div>
        </div>
        <div className="metric-item" style={{ flex: 1 }}>
          <div className="metric-value mono-sm">v1.0.0</div>
          <div className="metric-label">Version</div>
        </div>
      </div>
    </div>
  );
}
