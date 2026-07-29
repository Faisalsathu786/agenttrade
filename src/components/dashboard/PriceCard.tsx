'use client';

import { useMemo } from 'react';
import { Lang, t } from '@/lib/i18n';
import { ASSETS, AssetKey } from '@/lib/contracts';

interface PriceData {
  price: number;
  change24h: number;
}

interface PriceCardProps {
  lang: Lang;
  asset: AssetKey;
  data: PriceData | null;
  onFetch?: (asset: AssetKey) => void;
}

export default function PriceCard({ lang, asset, data, onFetch }: PriceCardProps) {
  const info = ASSETS[asset];
  const isPositive = data && data.change24h >= 0;
  const isNegative = data && data.change24h < 0;

  const formattedPrice = useMemo(() => {
    if (!data) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(data.price);
  }, [data]);

  const formattedChange = useMemo(() => {
    if (!data) return '—';
    const sign = data.change24h >= 0 ? '+' : '';
    return `${sign}${data.change24h.toFixed(2)}%`;
  }, [data]);

  return (
    <div className="glass-card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Color accent bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: info.color,
        opacity: 0.6,
        borderTopLeftRadius: 'var(--radius-lg)',
        borderTopRightRadius: 'var(--radius-lg)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${info.color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
              color: info.color,
            }}>
              {info.label}
            </span>
            <span className="body" style={{ color: 'var(--text-primary)' }}>{info.name}</span>
          </div>
        </div>
        <span className="badge badge-gold">{t('price.live', lang)}</span>
      </div>

      <div className="price-value mono" style={{ marginBottom: 6 }}>
        {data ? (
          <span className={`num-tick ${isPositive ? 'up' : isNegative ? 'down' : ''}`}>
            {formattedPrice}
          </span>
        ) : '—'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className={`price-change ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
          {formattedChange}
        </span>
        <span className="caption">{t('price.24h', lang)}</span>
      </div>

      <button
        onClick={() => onFetch?.(asset)}
        style={{
          marginTop: 16,
          width: '100%',
          padding: '10px 0',
          background: 'var(--accent-gold-dim)',
          border: '1px solid rgba(196, 169, 106, 0.2)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--accent-gold)',
          fontSize: '0.85rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(196, 169, 106, 0.22)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--accent-gold-dim)';
        }}
      >
        {t('price.trigger', lang)}
      </button>
    </div>
  );
}
