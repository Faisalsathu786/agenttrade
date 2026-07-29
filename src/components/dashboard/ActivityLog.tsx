'use client';

import { Clock } from 'lucide-react';

interface ActivityEntry {
  type: string;
  asset: string;
  detail: string;
  time: string;
}

interface ActivityLogProps {
  entries: ActivityEntry[];
}

const DOT_CLASS: Record<string, string> = {
  decision: 'success',
  analysis: 'primary',
  price: 'warning',
};

export default function ActivityLog({ entries }: ActivityLogProps) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Activity Timeline</span>
        <span className="caption">{entries.length} events</span>
      </div>

      {entries.length === 0 ? (
        <div className="caption">No activity recorded yet.</div>
      ) : (
        <div>
          {entries.map((entry, i) => (
            <div key={i} className="timeline-item">
              <div className={`timeline-dot ${DOT_CLASS[entry.type] || 'primary'}`} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontWeight: 500, fontSize: '0.8rem' }}>{entry.asset}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 6 }}>
                    {entry.detail}
                  </span>
                </div>
                <span className="caption" style={{ flexShrink: 0, marginLeft: 12 }}>{entry.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
