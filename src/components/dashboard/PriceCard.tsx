'use client';

interface PriceData {
  price: number;
  change24h: number;
}

interface PriceCardProps {
  asset: string;
  data: PriceData | null;
  logoUrl: string;
  loading: boolean;
  onFetch: (asset: string) => void;
}

const LOGOS: Record<string, string> = {
  BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  SOL: 'https://cryptologos.cc/logos/solana-sol-logo.png',
};

export default function PriceCard({ asset, data, loading, onFetch }: PriceCardProps) {
  const logo = LOGOS[asset];

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src={logo}
            alt={asset}
            style={{ width: 24, height: 24, borderRadius: '50%' }}
          />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{asset}</span>
        </div>
        <span className="badge badge-success">
          <div className="status-dot live" style={{ width: 5, height: 5 }} />
          Live
        </span>
      </div>

      {loading ? (
        <div>
          <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '30%', height: 16 }} />
        </div>
      ) : data ? (
        <div>
          <div className="price-value">
            ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span className={`price-change ${data.change24h >= 0 ? 'up' : 'down'}`}>
              {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
            </span>
            <span className="caption">24h</span>
          </div>
        </div>
      ) : (
        <div className="caption">Unable to load price data</div>
      )}

      <button
        className="btn btn-outline btn-sm"
        onClick={() => onFetch(asset)}
        style={{ marginTop: 12, width: '100%' }}
      >
        Refresh
      </button>
    </div>
  );
}
