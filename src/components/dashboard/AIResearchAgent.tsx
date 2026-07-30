'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAccount, useBalance, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, parseEther } from 'viem';
import { Send, Loader2, ExternalLink, Wallet, Coins, AlertCircle, CheckCircle2 } from 'lucide-react';

const TREASURY_ADDRESS = '0x9385556B571ab92bf6dC9a0DbD75429Dd4d56F91';

const TREASURY_ABI = [
  {
    type: 'function',
    name: 'payForQuery',
    inputs: [{ internalType: 'string', name: 'question', type: 'string' }],
    outputs: [],
    stateMutability: 'payable',
  },
] as const;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: { title: string; url: string; snippet: string }[];
  timestamp: number;
  txHash?: string;
}

const SUGGESTIONS = [
  'Explain how Bitcoin works and what gives it value',
  'Compare Ethereum vs Solana — which is better for DeFi?',
  'What is Ritual Chain and what makes it special?',
  'How do on-chain AI agents make decisions?',
  'Explain DeFi yield farming and the risks involved',
];

const FEE_ETH = '0.001';

export default function AIResearchAgent() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pendingQuery, setPendingQuery] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const balanceFormatted = balance ? formatEther(balance.value) : '0';
  const hasEnoughBalance = balance && Number(formatEther(balance.value)) >= Number(FEE_ETH);
  const onRitual = chain?.id === 1979;

  // ─── Contract Write ──────────────────────────────────
  const { writeContractAsync, data: txHash, isPending: isTxPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // When transaction is confirmed on-chain, fetch the answer
  useEffect(() => {
    if (!isConfirmed || !txHash || !pendingQuery) return;

    const query = pendingQuery;
    setPendingQuery('');
    setIsPaying(false);

    setMessages((prev) => [
      ...prev,
      { role: 'system', content: `Fee paid: ${FEE_ETH} ETH. Transaction confirmed. Researching...`, timestamp: Date.now(), txHash },
    ]);

    fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then((data) => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.answer, sources: data.sources || [], timestamp: Date.now() },
        ]);
      })
      .catch(() => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Research failed. Please try again.', timestamp: Date.now() },
        ]);
      });
  }, [isConfirmed, txHash, pendingQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPaying, isTxPending, isConfirming]);

  const handleSend = useCallback(async () => {
    const query = input.trim();
    if (!query || !isConnected || !onRitual || !hasEnoughBalance || isPaying || isTxPending) return;

    // Show user message
    setMessages((prev) => [...prev, { role: 'user', content: query, timestamp: Date.now() }]);
    setInput('');

    // Trigger wallet popup
    setPendingQuery(query);
    setIsPaying(true);

    try {
      await writeContractAsync({
        address: TREASURY_ADDRESS,
        abi: TREASURY_ABI,
        functionName: 'payForQuery',
        args: [query],
        value: parseEther(FEE_ETH),
        gas: BigInt(500000),
        gasPrice: BigInt(1000000000),
        chainId: 1979,
      });
      // txHash will be set by useWriteContract → useWaitForTransactionReceipt → isConfirmed
    } catch (err: any) {
      setIsPaying(false);
      setPendingQuery('');
      const msg = err?.code === 4001 || err?.message?.includes('rejected')
        ? 'Transaction cancelled.'
        : `Transaction failed: ${err?.message?.slice(0, 80) || 'Unknown error'}`;
      setMessages((prev) => [...prev, { role: 'system', content: msg, timestamp: Date.now() }]);
    }
  }, [input, isConnected, onRitual, hasEnoughBalance, isPaying, isTxPending, writeContractAsync]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isLoading = isPaying || isTxPending || isConfirming;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-4) var(--space-5)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>AI Research Agent</div>
            <div className="caption">
              {isConnected ? `Connected · ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Wallet required'}
            </div>
          </div>
        </div>
        {isConnected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge ${onRitual ? 'badge-success' : 'badge-warning'}`}>
              {onRitual ? 'Ritual Chain' : chain?.name || 'Unknown'}
            </span>
            <button onClick={() => disconnect()} className="btn btn-ghost btn-sm">Disconnect</button>
          </div>
        ) : null}
      </div>

      {/* Not connected */}
      {!isConnected ? (
        <div style={{ padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontWeight: 600, fontSize: '1rem' }}>Connect Your Wallet</div>
          <div className="body" style={{ maxWidth: 320, textAlign: 'center' }}>
            Connect your wallet on Ritual Chain to ask AI research questions. Each question costs {FEE_ETH} ETH — fee is collected on-chain.
          </div>
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button onClick={openConnectModal} className="btn btn-primary">
                <Wallet size={16} /> Connect Wallet
              </button>
            )}
          </ConnectButton.Custom>
          <div className="caption">Ritual Chain (ID: 1979) required</div>
        </div>
      ) : !onRitual ? (
        <div style={{ padding: '40px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Switch to Ritual Chain</div>
          <div className="body">Switch your wallet to Ritual Chain (ID: 1979).</div>
        </div>
      ) : !hasEnoughBalance ? (
        <div style={{ padding: '40px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Insufficient Balance</div>
          <div className="body">
            Need at least {FEE_ETH} ETH on Ritual Chain. Balance: {Number(balanceFormatted).toFixed(4)} ETH
          </div>
        </div>
      ) : (
        <div>
          {/* Fee banner */}
          <div style={{ padding: '6px var(--space-5)', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)' }}>
            <Coins size={12} />
            <span>Each question costs <strong>{FEE_ETH} ETH</strong></span>
          </div>

          {/* Messages */}
          <div style={{ maxHeight: 400, overflowY: 'auto', padding: 'var(--space-4) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.length === 0 ? (
              <div className="caption" style={{ textAlign: 'center', padding: '20px 0' }}>
                Type a question and click send. Your wallet will open — confirm {FEE_ETH} ETH fee to get your answer.
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`}>
                  <div className="chat-avatar">{msg.role === 'user' ? 'U' : msg.role === 'system' ? '⚡' : 'AI'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className={`chat-text ${msg.role === 'assistant' ? 'system' : ''}`}
                      style={msg.role === 'assistant' ? { background: 'var(--surface)', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap' } : msg.role === 'system' ? { background: 'var(--primary-dim)', border: '1px solid rgba(124,58,237,0.2)', textAlign: 'center' } : {}}
                    >
                      {msg.role === 'assistant'
                        ? <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                        : msg.content
                      }
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {msg.sources.slice(0, 4).map((s, j) => s.url ? (
                          <a key={j} href={s.url} target="_blank" rel="noopener noreferrer" className="source-chip">
                            <ExternalLink size={10} /> {s.title.slice(0, 30)}
                          </a>
                        ) : null)}
                      </div>
                    )}
                    {msg.txHash && (
                      <div className="caption" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={10} style={{ color: 'var(--success)' }} />
                        <a href={`https://explorer.ritualfoundation.org/tx/${msg.txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--success)' }}>
                          View on Explorer
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="chat-bubble assistant">
                <div className="chat-avatar">AI</div>
                <div className="typing-indicator"><span /><span /><span /></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {messages.length === 0 && (
            <div style={{ padding: '0 var(--space-5) var(--space-2)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
          )}

          <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-4)' }}>
            <div className="chat-input-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any question..."
                className="chat-input"
                disabled={isLoading}
              />
              <button onClick={handleSend} disabled={isLoading || !input.trim()} className="chat-send-btn">
                {isLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
              </button>
            </div>
            <div className="caption" style={{ textAlign: 'center', marginTop: 6, fontSize: '0.65rem' }}>
              Wallet will open to confirm {FEE_ETH} ETH fee
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
