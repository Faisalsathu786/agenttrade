'use client';

interface AgentOverviewProps {
  totalDecisions: number;
  active: boolean;
  lastActivityBlock: number | null;
  totalCollected?: string;
}

export default function AgentOverview({ totalDecisions, active, lastActivityBlock, totalCollected }: AgentOverviewProps) {
  const lastBlock = lastActivityBlock ? `#${lastActivityBlock.toLocaleString()}` : '—';
  const treasury = totalCollected || '0 ETH';

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Agent Overview</span>
        <span className={`badge ${active ? 'badge-success' : 'badge-warning'}`}>
          <div className={`status-dot ${active ? 'live' : 'idle'}`} style={{ width: 5, height: 5 }} />
          {active ? 'Active' : 'Idle'}
        </span>
      </div>

      <div className="metrics-row">
        <div className="metric-item" style={{ flex: 1 }}>
          <div className="metric-value">{totalDecisions > 0 ? totalDecisions : '—'}</div>
          <div className="metric-label">Total Decisions</div>
        </div>
        <div className="metric-item" style={{ flex: 1 }}>
          <div className="metric-value">{lastBlock}</div>
          <div className="metric-label">Last Block</div>
        </div>
        <div className="metric-item" style={{ flex: 1 }}>
          <div className="metric-value">{treasury}</div>
          <div className="metric-label">Treasury</div>
        </div>
        <div className="metric-item" style={{ flex: 1 }}>
          <div className="metric-value mono-sm">v1.0</div>
          <div className="metric-label">Version</div>
        </div>
      </div>
    </div>
  );
}
