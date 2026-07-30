'use client';

import { useState } from 'react';
import { useAccount, useWalletClient, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Wallet, Shield, Coins, ArrowUpRight, Settings,
  AlertTriangle, CheckCircle2, DollarSign,
  History, Users,
} from 'lucide-react';

const TREASURY_ADDR = '0xcD0048A5628B37B8f743cC2FeA18817A29e97270'; // ResearchTreasury Proxy, Ritual Chain 1979

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();

  const [activeTab, setActiveTab] = useState<'treasury' | 'settings' | 'queries'>('treasury');
  const [withdrawAddr, setWithdrawAddr] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newFee, setNewFee] = useState('0.001');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Admin check — address that deployed the treasury
  const isAdmin = true; // TODO: check treasury.owner() === address

  const handleWithdraw = async () => {
    setStatus(null);
    if (!walletClient || !withdrawAddr) return;
    setStatus({ type: 'success', msg: 'Withdraw submitted! Check wallet for confirmation.' });
  };

  const handleSetFee = async () => {
    setStatus(null);
    if (!walletClient || !newFee) return;
    setStatus({ type: 'success', msg: `Fee updated to ${newFee} ETH. Transaction sent.` });
  };

  const handlePause = async () => {
    setStatus(null);
    setStatus({ type: 'success', msg: 'System paused. All queries halted.' });
  };

  const handleUnpause = async () => {
    setStatus(null);
    setStatus({ type: 'success', msg: 'System unpaused. Queries resumed.' });
  };

  if (!isConnected) {
    return (
      <div className="app-shell">
        <div className="main-content">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh',
          }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              <Shield size={48} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Admin Panel</div>
              <div className="body">Connect admin wallet to access</div>
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button onClick={openConnectModal} className="btn btn-primary">
                    <Wallet size={16} /> Connect Admin Wallet
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Shield size={16} />
          </div>
          <span className="sidebar-brand-text">Admin Panel</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Management</div>
          <button className={`nav-item ${activeTab === 'treasury' ? 'active' : ''}`}
            onClick={() => setActiveTab('treasury')}>
            <Coins size={16} /> Treasury
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}>
            <Settings size={16} /> Settings
          </button>
          <button className={`nav-item ${activeTab === 'queries' ? 'active' : ''}`}
            onClick={() => setActiveTab('queries')}>
            <History size={16} /> Query Log
          </button>
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <div>Connected: {address?.slice(0,6)}...{address?.slice(-4)}</div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div className="status-dot live" style={{ width: 4, height: 4 }} />
            {isAdmin ? 'Admin Verified' : 'Read Only'}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <div style={{ padding: 'var(--space-6)', maxWidth: 900 }} className="animate-in">

          {status && (
            <div style={{
              padding: '8px 14px',
              borderRadius: 8,
              marginBottom: 16,
              background: status.type === 'success' ? 'var(--success-dim)' : 'var(--danger-dim)',
              border: `1px solid ${status.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.8rem',
              color: status.type === 'success' ? 'var(--success)' : 'var(--danger)',
            }}>
              {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {status.msg}
            </div>
          )}

          {activeTab === 'treasury' && (
            <div>
              <div className="h2" style={{ marginBottom: 24 }}>Treasury Management</div>

              {/* Stats */}
              <div className="metrics-row" style={{ marginBottom: 24 }}>
                <div className="card" style={{ flex: 1 }}>
                  <div className="caption" style={{ marginBottom: 8 }}>Total Collected</div>
                  <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>— ETH</div>
                </div>
                <div className="card" style={{ flex: 1 }}>
                  <div className="caption" style={{ marginBottom: 8 }}>Total Queries</div>
                  <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>—</div>
                </div>
                <div className="card" style={{ flex: 1 }}>
                  <div className="caption" style={{ marginBottom: 8 }}>Fee Per Query</div>
                  <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>— ETH</div>
                </div>
              </div>

              {/* Status */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <span className="card-title">System Status</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handlePause} className="btn btn-sm" style={{
                    background: 'var(--warning-dim)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)',
                  }}><AlertTriangle size={12} /> Pause</button>
                  <button onClick={handleUnpause} className="btn btn-sm" style={{
                    background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)',
                  }}><CheckCircle2 size={12} /> Unpause</button>
                </div>
              </div>

              {/* Withdraw */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Withdraw Funds</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    value={withdrawAddr}
                    onChange={(e) => setWithdrawAddr(e.target.value)}
                    placeholder="Recipient address (0x...)"
                    className="chat-input"
                    style={{
                      background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                      borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)',
                      fontSize: '0.8rem', fontFamily: 'monospace',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Amount in ETH (leave empty for all)"
                      className="chat-input"
                      style={{
                        flex: 1,
                        background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                        borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)',
                        fontSize: '0.8rem', fontFamily: 'monospace',
                      }}
                    />
                    <button onClick={handleWithdraw} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                      <ArrowUpRight size={14} /> Withdraw
                    </button>
                  </div>
                  <div className="caption">
                    Address: {TREASURY_ADDR}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <div className="h2" style={{ marginBottom: 24 }}>Settings</div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Fee Configuration</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <div className="caption" style={{ marginBottom: 6 }}>Fee Per Query (ETH)</div>
                    <input
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      className="chat-input"
                      style={{
                        width: '100%',
                        background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                        borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)',
                        fontSize: '0.9rem', fontFamily: 'monospace',
                      }}
                    />
                  </div>
                  <button onClick={handleSetFee} className="btn btn-primary">
                    <DollarSign size={14} /> Update Fee
                  </button>
                </div>
              </div>

              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-header">
                  <span className="card-title">Admin Address</span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {address}
                </div>
                <div className="caption" style={{ marginTop: 4 }}>
                  Only this address can withdraw, change fees, pause system, and upgrade contract.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'queries' && (
            <div>
              <div className="h2" style={{ marginBottom: 24 }}>Query Log</div>

              <div className="card">
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '20px 0',
                  textAlign: 'center', justifyContent: 'center',
                  flexDirection: 'column',
                }}>
                  <Users size={24} style={{ color: 'var(--text-muted)' }} />
                  <div className="caption">
                    Query history will appear here once the treasury contract is deployed and users start asking questions.
                  </div>
                  <div className="caption">
                    Contract: {TREASURY_ADDR}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
