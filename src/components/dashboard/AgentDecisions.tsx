'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Pause, Clock, Activity } from 'lucide-react';
import { ethCall, AGENT_STATE_SELECTOR, LATEST_DECISION_SELECTOR, decodeAgentState, decodeLatestDecision } from '@/lib/rpc';
import { AGENT_TRADER } from '@/lib/contracts';

interface DecisionItem {
  symbol: string;
  direction: string;
  confidence: number;
  price: number;
  age: string;
}

export default function AgentDecisionsPanel() {
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [state, setState] = useState({ totalDecisions: 0, active: false });
  const [updates, setUpdates] = useState(0);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const [stateHex, decisionHex] = await Promise.all([
          ethCall(AGENT_TRADER, AGENT_STATE_SELECTOR),
          ethCall(AGENT_TRADER, LATEST_DECISION_SELECTOR),
        ]);
        const s = decodeAgentState(stateHex);
        setState({ totalDecisions: s.totalDecisions, active: s.active });

        if (s.totalDecisions > 0 && decisionHex && decisionHex !== '0x') {
          const d = decodeLatestDecision(decisionHex);
          const newItem: DecisionItem = {
            symbol: d.asset,
            direction: d.direction,
            confidence: d.confidence,
            price: d.price,
            age: `${d.age}m ago`,
          };
          setDecisions((prev) => {
            const exists = prev.some(p => p.symbol === d.asset && p.price === d.price);
            if (exists) return prev;
            setUpdates(prev => prev + 1);
            return [newItem, ...prev.slice(0, 19)];
          });
        }
      } catch {}
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 12000); // every 12s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Agent Decisions</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
            {state.totalDecisions}
          </span>
          <div className={`status-dot ${state.active ? 'live' : 'off'}`} />
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="caption" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
          Waiting for first decision...
        </div>
      ) : (
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {decisions.map((d, i) => (
            <div key={`${d.symbol}-${i}`} style={{
              padding: '10px var(--space-4)',
              borderBottom: i < decisions.length - 1 ? '1px solid var(--border-color)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              animation: i === 0 ? 'fadeIn 0.3s ease' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: d.direction === 'BULLISH' ? 'var(--success-dim)' :
                             d.direction === 'BEARISH' ? 'var(--danger-dim)' : 'var(--warning-dim)',
                }}>
                  {d.direction === 'BULLISH' ? <TrendingUp size={13} style={{ color: 'var(--success)' }} /> :
                   d.direction === 'BEARISH' ? <TrendingDown size={13} style={{ color: 'var(--danger)' }} /> :
                   <Pause size={13} style={{ color: 'var(--warning)' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.78rem' }}>{d.symbol}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} />
                    {d.age}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className={`decision-label decision-${d.direction.toLowerCase()}`}
                  style={{ fontSize: '0.65rem' }}>
                  {d.direction}
                </span>
                <div className="mono-sm" style={{ marginTop: 2, color: 'var(--text-secondary)' }}>
                  ${d.price.toLocaleString()} · {d.confidence}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live update indicator */}
      <div style={{
        padding: '4px var(--space-4)',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.65rem', color: 'var(--text-muted)',
        display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
      }}>
        <div className="status-dot live" style={{ width: 4, height: 4 }} />
        Live · {updates > 0 ? `${updates} updates this session` : 'watching for changes'}
      </div>
    </div>
  );
}
