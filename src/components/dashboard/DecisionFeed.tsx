'use client';

export interface DecisionData {
  symbol: string;
  price: number;
  direction: string;
  confidence: number;
  timestamp: number;
}

interface DecisionFeedProps {
  decisions: DecisionData[];
  loading: boolean;
  error: string | null;
}

const DIRECTION_COLORS: Record<string, { bg: string; text: string }> = {
  BULLISH: { bg: 'var(--success-dim)', text: 'var(--success)' },
  BEARISH: { bg: 'var(--danger-dim)', text: 'var(--danger)' },
  HOLD:    { bg: 'var(--warning-dim)', text: 'var(--warning)' },
};

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DecisionFeed({ decisions, loading, error }: DecisionFeedProps) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: 'var(--space-5) var(--space-5) 0' }}>
        <div className="card-header">
          <span className="card-title">On-Chain Decisions</span>
          {error ? (
            <span className="badge badge-warning">Degraded</span>
          ) : (
            <span className="badge badge-primary">{decisions.length} records</span>
          )}
        </div>
      </div>

      {error && (
        <div className="caption" style={{ padding: '0 var(--space-5)', marginBottom: 8 }}>{error}</div>
      )}

      {loading && decisions.length === 0 ? (
        <div style={{ padding: 'var(--space-5)' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div className="skeleton" style={{ width: 40, height: 16 }} />
              <div className="skeleton" style={{ flex: 1, height: 16 }} />
            </div>
          ))}
        </div>
      ) : decisions.length === 0 ? (
        <div className="caption" style={{ padding: 'var(--space-5)' }}>
          No decisions recorded yet. Agent is waiting for its first analysis cycle.
        </div>
      ) : (
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Direction</th>
                <th>Confidence</th>
                <th>Price</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d, i) => {
                const colors = DIRECTION_COLORS[d.direction] || DIRECTION_COLORS.HOLD;
                return (
                  <tr key={`${d.symbol}-${d.timestamp}-${i}`}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                      {d.symbol}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '1px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        background: colors.bg,
                        color: colors.text,
                      }}>
                        {d.direction}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="progress-bar" style={{ width: 48, height: 3 }}>
                          <div className="progress-fill" style={{
                            width: `${d.confidence}%`,
                            background: d.confidence >= 70 ? 'var(--success)' :
                                        d.confidence >= 50 ? 'var(--warning)' : 'var(--danger)',
                          }} />
                        </div>
                        <span className="mono-sm">{d.confidence}%</span>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                      ${d.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="caption">{formatTime(d.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
