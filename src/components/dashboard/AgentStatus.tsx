'use client';

import { t, Lang } from '@/lib/i18n';
import { RITUAL_EXPLORER, AGENT_TRADER } from '@/lib/contracts';

export default function AgentStatus({ lang }: { lang: Lang }) {
  // In production, these would come from contract reads
  const stats = {
    decisions: 0,
    uptime: '0h',
    active: true,
  };

  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 className="h3" style={{ margin: 0 }}>{t('agent.status', lang)}</h3>
        <span className="badge badge-success">
          <div className="pulse-dot" style={{ width: 7, height: 7 }} />
          {t('agent.active', lang)}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div>
          <div className="caption" style={{ marginBottom: 4 }}>{t('agent.decisions', lang)}</div>
          <div className="h2 mono" style={{ margin: 0 }}>{stats.decisions}</div>
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 4 }}>{t('agent.performance', lang)}</div>
          <div className="h2 mono" style={{ margin: 0, color: 'var(--positive)' }}>—</div>
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 4 }}>{t('agent.uptime', lang)}</div>
          <div className="h2 mono" style={{ margin: 0 }}>{stats.uptime}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
        <span className="badge badge-violet">{t('agent.version', lang)} 1.0.0</span>
        <a
          href={`${RITUAL_EXPLORER}/address/${AGENT_TRADER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="caption"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {t('agent.view', lang)} ↗
        </a>
      </div>
    </div>
  );
}
