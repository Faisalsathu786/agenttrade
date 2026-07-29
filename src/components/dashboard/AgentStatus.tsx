'use client';

import { t, Lang } from '@/lib/i18n';
import { AGENT_TRADER, RITUAL_EXPLORER } from '@/lib/contracts';

interface OnChainState {
  totalDecisions: number;
  active: boolean;
  lastActivityBlock: number;
}

export default function AgentStatus({ lang, onChainState }: { lang: Lang; onChainState: OnChainState | null }) {
  const decisions = onChainState?.totalDecisions ?? null;
  const active = onChainState?.active ?? true;
  const blockNumber = onChainState?.lastActivityBlock ?? null;

  const uptimeMins = blockNumber ? Math.floor((blockNumber * 2) / 60) : 0;
  const uptimeDisplay = uptimeMins < 60 ? `${uptimeMins}m` : `${Math.floor(uptimeMins / 60)}h ${uptimeMins % 60}m`;

  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 className="h3" style={{ margin: 0 }}>{t('agent.status', lang)}</h3>
        <span className={`badge ${active ? 'badge-success' : 'badge'}`}>
          {active && <div className="pulse-dot" style={{ width: 7, height: 7, marginRight: 4 }} />}
          {active ? t('agent.active', lang) : 'Inactive'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div>
          <div className="caption" style={{ marginBottom: 4 }}>{t('agent.decisions', lang)}</div>
          <div className="h2 mono" style={{ margin: 0 }}>
            {decisions !== null ? decisions : '...'}
          </div>
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 4 }}>{t('agent.performance', lang)}</div>
          <div className="h2 mono" style={{ margin: 0, color: 'var(--text-dim)' }}>
            {decisions !== null ? (decisions > 0 ? 'Active' : 'Initializing') : '...'}
          </div>
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 4 }}>{t('agent.uptime', lang)}</div>
          <div className="h2 mono" style={{ margin: 0 }}>
            {blockNumber ? uptimeDisplay : '...'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span className="badge badge-violet">{t('agent.version', lang)} 1.0.0</span>
        {blockNumber && (
          <span className="badge" style={{ background: 'var(--glass-border)', color: 'var(--text-dim)' }}>
            Block #{blockNumber}
          </span>
        )}
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
