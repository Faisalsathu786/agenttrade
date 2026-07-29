'use client';

import { Lang, t } from '@/lib/i18n';

interface ActivityEntry {
  type: 'price' | 'analysis' | 'decision';
  asset: string;
  detail: string;
  time: string;
}

interface ActivityLogProps {
  lang: Lang;
  entries: ActivityEntry[];
}

export default function ActivityLog({ lang, entries }: ActivityLogProps) {
  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <h3 className="h3" style={{ margin: '0 0 16px 0' }}>{t('activity.title', lang)}</h3>

      {entries.length === 0 ? (
        <p className="body" style={{ textAlign: 'center', padding: '32px 0' }}>
          {t('activity.empty', lang)}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {entries.map((entry, i) => {
            const isLast = i === entries.length - 1;
            const typeLabel = entry.type === 'price'
              ? t('activity.fetch', lang)
              : entry.type === 'analysis'
                ? t('activity.analysis', lang)
                : t('activity.decision', lang);

            return (
              <div
                key={i}
                className={`timeline-line ${isLast ? '' : ''}`}
                style={{ padding: '10px 0 10px 24px', position: 'relative' }}
              >
                {!isLast && <div style={{
                  position: 'absolute',
                  left: 7,
                  top: 28,
                  bottom: -2,
                  width: 1,
                  background: 'var(--border-active)',
                }} />}
                <div className="timeline-dot" />
                <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>
                  {typeLabel} <span style={{ color: 'var(--accent-gold)' }}>{entry.asset}</span>
                </div>
                <div className="caption" style={{ marginTop: 2 }}>{entry.detail}</div>
                <div className="caption" style={{ marginTop: 2, fontSize: '0.7rem' }}>{entry.time}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
