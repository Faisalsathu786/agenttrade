'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Lang, t } from '@/lib/i18n';
import { AssetKey } from '@/lib/contracts';

interface PriceData {
  price: number;
  change24h: number;
}

interface PriceCardProps {
  lang: Lang;
  asset: AssetKey;
  data: PriceData | null;
  logoUrl?: string;
  accentColor?: string;
  loading?: boolean;
  onFetch?: (asset: AssetKey) => void;
}

export default function PriceCard({ lang, asset, data, logoUrl, accentColor = '#888', loading, onFetch }: PriceCardProps) {
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
        background: accentColor,
        opacity: 0.6,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={asset}
                width={28}
                height={28}
                style={{ borderRadius: '50%' }}
                unoptimized
              />
            ) : (
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `${accentColor}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.7rem', color: accentColor,
              }}>
                {asset.slice(0, 2)}
              </span>
            )}
            <span className="body" style={{ color: 'var(--text-primary)' }}>{asset}</span>
          </div>
        </div>
        {!loading && data && (
          <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
            {t('price.live', lang)}
          </span>
        )}
        {loading && (
          <span className="badge" style={{ background: 'var(--glass-border)', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
            loading...
          </span>
        )}
      </div>

      <div className="price-value mono" style={{ marginBottom: 6, minHeight: 38 }}>
        {loading ? (
          <span style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>—</span>
        ) : data ? (
          <span>{formattedPrice}</span>
        ) : (
          <span style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>—</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 22 }}>
        {data ? (
          <>
            <span className={`price-change ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
              {formattedChange}
            </span>
            <span className="caption">{t('price.24h', lang)}</span>
          </>
        ) : <span className="caption" style={{ color: 'var(--text-dim)' }}>waiting for data...</span>}
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
        {'\u{1F504}'} {t('price.trigger', lang)}
      </button>
    </div>
  );
}
