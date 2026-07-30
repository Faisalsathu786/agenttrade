'use client';

import { Activity, TrendingUp, Cpu, BarChart3, MessageSquare, Network, Layers } from 'lucide-react';

interface SidebarProps {
  active: string;
  onNavigate: (section: string) => void;
}

const NAV_ITEMS = [
  { id: 'status',    icon: Activity,     label: 'Agent Status' },
  { id: 'market',    icon: TrendingUp,   label: 'Live Market' },
  { id: 'decisions', icon: BarChart3,    label: 'Decisions' },
  { id: 'ai-model',  icon: Cpu,          label: 'AI Model' },
  { id: 'assistant', icon: MessageSquare, label: 'Research' },
  { id: 'infra',     icon: Network,      label: 'Infrastructure' },
  { id: 'arch',      icon: Layers,       label: 'Architecture' },
];

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <TrendingUp size={16} />
        </div>
        <span className="sidebar-brand-text">AgentTrade</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Ritual Chain · ID 1979
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <div className="status-dot live" />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Agent Active</span>
        </div>
      </div>
    </aside>
  );
}
