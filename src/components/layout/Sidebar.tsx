'use client';

import { Home, TrendingUp, History, Search } from 'lucide-react';

interface SidebarProps {
  active: string;
  onNavigate: (section: string) => void;
}

const NAV_ITEMS = [
  { id: 'overview',  icon: Home,        label: 'Overview' },
  { id: 'markets',   icon: TrendingUp,  label: 'Markets' },
  { id: 'history',   icon: History,     label: 'History' },
  { id: 'research',  icon: Search,      label: 'Research' },
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="status-dot live" />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Agent Active</span>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Developed by Crypto Coach
        </div>
      </div>
    </aside>
  );
}
