'use client';

import { Lang, t } from '@/lib/i18n';
import { decisionLabel, assetInfo } from '@/lib/contracts';

interface Decision {
  id: number;
  asset: number;
  decision: number;
  price: number;
  timestamp: number;
  reasoning: string;
}

interface DecisionFeedProps {
  lang: Lang;
  decisions: Decision[];
}

export default function DecisionFeed({ lang, decisions }: DecisionFeedProps) {
  if (decisions.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }}>⚡</div>
          <p className="body">{t('decision.none', lang)}</p>
        </div>
      </div>
    );
  }

  const latest = decisions[decisions.length - 1];
  const ai = assetInfo(latest.asset);
  const label = decisionLabel(latest.decision);
  const cls = label === 'BUY' ? 'decision-buy' : label === 'SELL' ? 'decision-sell' : 'decision-hold';

  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <h3 className="h3" style={{ margin: '0 0 16px 0' }}>{t('decision.title', lang)}</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span className={`decision-label ${cls}`}>{label}</span>
        {ai && (
          <span className="badge badge-violet">
            {ai.label} — {t('decision.price', lang)} ${latest.price.toLocaleString()}
          </span>
        )}
      </div>

      <p className="body" style={{ margin: '0 0 12px 0', lineHeight: 1.7, color: 'var(--text-primary)' }}>
        {latest.reasoning || 'Analysis pending from Ritual LLM precompile...'}
      </p>

      <div className="caption" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{t('decision.time', lang)}: {new Date(latest.timestamp * 1000).toLocaleString()}</span>
        {ai && <span>{t('decision.asset', lang)}: {ai.name}</span>}
      </div>
    </div>
  );
}
