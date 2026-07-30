'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lang, getLangFromStorage } from '@/lib/i18n';
import { AGENT_TRADER } from '@/lib/contracts';
import { ethCall, AGENT_STATE_SELECTOR, LATEST_DECISION_SELECTOR, decodeAgentState, decodeLatestDecision } from '@/lib/rpc';
import type { DecisionData } from '@/components/dashboard/DecisionFeed';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import AgentStatus from '@/components/dashboard/AgentStatus';
import PriceCard from '@/components/dashboard/PriceCard';
import DecisionFeed from '@/components/dashboard/DecisionFeed';
import AIResearchAgent from '@/components/dashboard/AIResearchAgent';
import AgentDecisionsPanel from '@/components/dashboard/AgentDecisions';

const COINGECKO_IDS: Record<string, string> = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana' };

interface PriceData {
  price: number;
  change24h: number;
}

interface OnChainState {
  totalDecisions: number;
  active: boolean;
  lastActivityBlock: number | null;
}

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>(getLangFromStorage);
  const [activeSection, setActiveSection] = useState('overview');
  const [prices, setPrices] = useState<Record<string, PriceData | null>>({ BTC: null, ETH: null, SOL: null });
  const [priceLoading, setPriceLoading] = useState(true);
  const [decisions, setDecisions] = useState<DecisionData[]>([]);
  const [decisionLoading, setDecisionLoading] = useState(true);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [lastDecisionTime, setLastDecisionTime] = useState(0);
  const [onChainState, setOnChainState] = useState<OnChainState>({ totalDecisions: 0, active: false, lastActivityBlock: null });

  const fetchPrices = useCallback(async () => {
    try {
      const ids = Object.values(COINGECKO_IDS).join(',');
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
      const data = await res.json();
      const newPrices: Record<string, PriceData | null> = {};
      for (const [key, cgId] of Object.entries(COINGECKO_IDS)) {
        const coin = data[cgId];
        if (coin) newPrices[key] = { price: coin.usd, change24h: coin.usd_24h_change ?? 0 };
      }
      setPrices((prev) => ({ ...prev, ...newPrices }));
      setPriceLoading(false);
    } catch { setPriceLoading(false); }
  }, []);

  const fetchOnChain = useCallback(async () => {
    try {
      const [stateHex, decisionHex] = await Promise.all([
        ethCall(AGENT_TRADER, AGENT_STATE_SELECTOR),
        ethCall(AGENT_TRADER, LATEST_DECISION_SELECTOR),
      ]);
      const state = decodeAgentState(stateHex);
      setOnChainState(state);
      setDecisionError(null);

      if (state.totalDecisions > 0 && decisionHex && decisionHex !== '0x') {
        try {
          const d = decodeLatestDecision(decisionHex);
          if (d.timestamp !== lastDecisionTime) {
            setLastDecisionTime(d.timestamp);
            const mapped: DecisionData = { symbol: d.asset, price: d.price, direction: d.direction, confidence: d.confidence, timestamp: d.timestamp };
            setDecisions((prev) => {
              const exists = prev.some((p) => p.timestamp === mapped.timestamp);
              return exists ? prev : [mapped, ...prev.slice(0, 99)];
            });
          }
        } catch {}
      }
      setDecisionLoading(false);
    } catch {
      setDecisionError('RPC unreachable');
      setDecisionLoading(false);
    }
  }, [lastDecisionTime]);

  useEffect(() => {
    fetchPrices();
    fetchOnChain();
    const interval = setInterval(() => { fetchPrices(); fetchOnChain(); }, 10000);
    return () => clearInterval(interval);
  }, [fetchPrices, fetchOnChain]);

  return (
    <div className="app-shell">
      <Sidebar active={activeSection} onNavigate={setActiveSection} />
      <div className="main-content">
        <Topbar lang={lang} onLangChange={setLang} />
        <div style={{ padding: 'var(--space-6)', maxWidth: 1100 }}>

          {activeSection === 'overview' && (
            <div className="animate-in">
              <AgentStatus
                totalDecisions={onChainState.totalDecisions}
                active={onChainState.active}
                lastActivityBlock={onChainState.lastActivityBlock}
              />
              <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {(['BTC', 'ETH', 'SOL'] as const).map((asset) => (
                  <PriceCard
                    key={asset}
                    asset={asset}
                    data={prices[asset]}
                    loading={priceLoading}
                    onFetch={() => {}}
                    logoUrl=""
                  />
                ))}
              </div>
            </div>
          )}

          {activeSection === 'markets' && (
            <div className="animate-in">
              <div className="h2" style={{ marginBottom: 20 }}>Market Prices</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {(['BTC', 'ETH', 'SOL'] as const).map((asset) => (
                  <PriceCard
                    key={asset}
                    asset={asset}
                    data={prices[asset]}
                    loading={priceLoading}
                    onFetch={() => {}}
                    logoUrl=""
                  />
                ))}
              </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="animate-in">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
                <DecisionFeed decisions={decisions} loading={decisionLoading} error={decisionError} />
                <AgentDecisionsPanel />
              </div>
            </div>
          )}

          {activeSection === 'research' && (
            <div className="animate-in">
              <AIResearchAgent />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
