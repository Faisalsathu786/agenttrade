'use client';

import { Server, Database, Globe, Shield } from 'lucide-react';

const SERVICES = [
  { name: 'Ritual Chain RPC', status: 'operational', latency: '~120ms', icon: Globe },
  { name: 'AgentTrader Contract', status: 'operational', latency: '0x8bD4...E2cB', icon: Shield },
  { name: 'CoinGecko API', status: 'operational', latency: '~80ms', icon: Server },
  { name: 'Adaption AI', status: 'operational', latency: 'Model Ready', icon: Database },
];

export default function InfrastructureStatus() {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Infrastructure</span>
        <span className="badge badge-success">All Systems Operational</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SERVICES.map((svc) => (
          <div key={svc.name} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svc.icon size={14} style={{ color: 'var(--text-muted)' }} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{svc.name}</div>
                <div className="caption">{svc.latency}</div>
              </div>
            </div>
            <div className="status-dot live" style={{ width: 6, height: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
