'use client';

import { useState, useEffect } from 'react';
import { t, Lang } from '@/lib/i18n';
import { AGENT_TRADER, RITUAL_EXPLORER } from '@/lib/contracts';
import { ethCall, AGENT_STATE_SELECTOR, decodeAgentState, getBlockNumber } from '@/lib/rpc';

export default function AgentStatus({ lang }: { lang: Lang }) {
  const [decisions, setDecisions] = useState<number | null>(null);
  const [active, setActive] = useState(true);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [stateHex, currentBlock] = await Promise.all([
          ethCall(AGENT_TRADER, AGENT_STATE_SELECTOR),
          getBlockNumber(),
        ]);
        const state = decodeAgentState(stateHex);
        setDecisions(state.totalDecisions);
        setActive(state.active);
        setBlockNumber(currentBlock);
      } catch {
        setError(true);
      }
    }
    load();
    // Refresh every 30s
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute uptime from current block — deployment was ~100 blocks ago
  const deployBlock = blockNumber ? blockNumber - 100 : null;
  const uptimeMins = deployBlock ? Math.floor((deployBlock * 2) / 60) : 0; // ~2s per block
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
            {decisions !== null ? decisions : error ? '—' : '...'}
          </div>
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 4 }}>{t('agent.performance', lang)}</div>
          <div className="h2 mono" style={{ margin: 0, color: 'var(--text-dim)' }}>
            {decisions !== null ? '—' : error ? '—' : '...'}
          </div>
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 4 }}>{t('agent.uptime', lang)}</div>
          <div className="h2 mono" style={{ margin: 0 }}>
            {blockNumber ? uptimeDisplay : error ? '—' : '...'}
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
