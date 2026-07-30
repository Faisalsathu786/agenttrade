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
import ActivityLog from '@/components/dashboard/ActivityLog';
import AdaptionAI from '@/components/dashboard/AdaptionAI';
import AIResearchAgent from '@/components/dashboard/AIResearchAgent';
import AgentDecisionsPanel from '@/components/dashboard/AgentDecisions';
import InfrastructureStatus from '@/components/dashboard/InfrastructureStatus';
import ArchitectureOverview from '@/components/dashboard/ArchitectureOverview';

const COINGECKO_IDS: Record<string, string> = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana' };

interface PriceData {
  price: number;
  change24h: number;
}

interface ActivityEntry {
  type: string;
  asset: string;
  detail: string;
  time: string;
}

interface OnChainState {
  totalDecisions: number;
  active: boolean;
  lastActivityBlock: number | null;
}

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>(getLangFromStorage);
  const [activeSection, setActiveSection] = useState('status');
  const [prices, setPrices] = useState<Record<string, PriceData | null>>({ BTC: null, ETH: null, SOL: null });
  const [priceLoading, setPriceLoading] = useState(true);
  const [decisions, setDecisions] = useState<DecisionData[]>([]);
  const [decisionLoading, setDecisionLoading] = useState(true);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [lastDecisionTime, setLastDecisionTime] = useState(0);
  const [onChainState, setOnChainState] = useState<OnChainState>({ totalDecisions: 0, active: false, lastActivityBlock: null });
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([
    { type: 'decision', asset: 'System', detail: 'AgentTrade deployed on Ritual Chain testnet', time: 'now' },
  ]);

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
              return exists ? prev : [mapped, ...prev.slice(0, 49)];
            });
          }
        } catch {}
      }
      setDecisionLoading(false);
    } catch {
      setDecisionError('RPC unreachable — using cached data');
      setDecisionLoading(false);
    }
  }, [lastDecisionTime]);

  useEffect(() => {
    fetchPrices();
    fetchOnChain();
    const interval = setInterval(() => { fetchPrices(); fetchOnChain(); }, 10000);
    return () => clearInterval(interval);
  }, [fetchPrices, fetchOnChain]);

  const handleFetchPrice = useCallback((asset: string) => {
    setActivityLog((prev) => [
      { type: 'price', asset, detail: 'Refresh triggered', time: 'now' },
      ...prev.slice(0, 19),
    ]);
    const cgId = COINGECKO_IDS[asset];
    if (cgId) {
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd&include_24hr_change=true`)
        .then((r) => r.json())
        .then((data) => {
          const coin = data[cgId];
          if (coin) setPrices((prev) => ({ ...prev, [asset]: { price: coin.usd, change24h: coin.usd_24h_change ?? 0 } }));
        }).catch(() => {});
    }
  }, []);

  return (
    <div className="app-shell">
      <Sidebar active={activeSection} onNavigate={setActiveSection} />
      <div className="main-content">
        <Topbar lang={lang} onLangChange={setLang} />
        <div style={{ padding: 'var(--space-6)', maxWidth: 1100 }}>

          {/* TAB: Agent Status */}
          {activeSection === 'status' && (
            <div className="animate-in">
              <AgentStatus
                totalDecisions={onChainState.totalDecisions}
                active={onChainState.active}
                lastActivityBlock={onChainState.lastActivityBlock}
              />
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <ArchitectureOverview />
                <ActivityLog entries={activityLog} />
              </div>
            </div>
          )}

          {/* TAB: Live Market */}
          {activeSection === 'market' && (
            <div className="animate-in">
              <div className="h2" style={{ marginBottom: 20 }}>Live Market</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {(['BTC', 'ETH', 'SOL'] as const).map((asset) => (
                  <PriceCard
                    key={asset}
                    asset={asset}
                    data={prices[asset]}
                    loading={priceLoading}
                    onFetch={handleFetchPrice}
                    logoUrl=""
                  />
                ))}
              </div>
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <AgentStatus
                  totalDecisions={onChainState.totalDecisions}
                  active={onChainState.active}
                  lastActivityBlock={onChainState.lastActivityBlock}
                />
                <InfrastructureStatus />
              </div>
            </div>
          )}

          {/* TAB: Decisions */}
          {activeSection === 'decisions' && (
            <div className="animate-in">
              <div className="h2" style={{ marginBottom: 20 }}>On-Chain Decisions</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
                <DecisionFeed decisions={decisions} loading={decisionLoading} error={decisionError} />
                <AgentDecisionsPanel />
              </div>
            </div>
          )}

          {/* TAB: AI Model */}
          {activeSection === 'ai-model' && (
            <div className="animate-in">
              <div className="h2" style={{ marginBottom: 20 }}>Model & Performance</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <AdaptionAI />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <AgentStatus
                    totalDecisions={onChainState.totalDecisions}
                    active={onChainState.active}
                    lastActivityBlock={onChainState.lastActivityBlock}
                  />
                  <InfrastructureStatus />
                </div>
              </div>
            </div>
          )}

          {/* TAB: Research */}
          {activeSection === 'assistant' && (
            <div className="animate-in">
              <AIResearchAgent />
            </div>
          )}

          {/* TAB: Infrastructure */}
          {activeSection === 'infra' && (
            <div className="animate-in">
              <div className="h2" style={{ marginBottom: 20 }}>Infrastructure</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <InfrastructureStatus />
                <ActivityLog entries={activityLog} />
              </div>
            </div>
          )}

          {/* TAB: Architecture */}
          {activeSection === 'arch' && (
            <div className="animate-in">
              <div className="h2" style={{ marginBottom: 20 }}>System Architecture</div>
              <ArchitectureOverview />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
