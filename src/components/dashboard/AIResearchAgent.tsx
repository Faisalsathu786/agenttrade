'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useBalance, useDisconnect, useWriteContract, useSimulateContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, parseEther } from 'viem';
import { Send, Loader2, ExternalLink, Wallet, Coins, AlertCircle, CheckCircle2 } from 'lucide-react';

const TREASURY_ADDRESS = '0x9385556B571ab92bf6dC9a0DbD75429Dd4d56F91';

const TREASURY_ABI = [
  {
    inputs: [{ internalType: 'string', name: 'question', type: 'string' }],
    name: 'payForQuery',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
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
  const [step, setStep] = useState<'idle' | 'waiting-wallet' | 'researching' | 'done'>('idle');
  const [pendingQuery, setPendingQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const balanceFormatted = balance ? formatEther(balance.value) : '0';
  const hasEnoughBalance = balance && Number(formatEther(balance.value)) >= Number(FEE_ETH);
  const onRitual = chain?.id === 1979;

  // Contract write for fee payment
  const { data: simulateData } = useSimulateContract({
    address: TREASURY_ADDRESS as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'payForQuery',
    args: [pendingQuery || '_'],
    value: parseEther(FEE_ETH),
    query: { enabled: pendingQuery.length > 0 },
  });

  const { writeContractAsync, data: txHash, isPending: isSendingTx } = useWriteContract();

  // When txHash appears, the transaction was submitted — now wait and fetch answer
  useEffect(() => {
    if (txHash && pendingQuery) {
      setStep('researching');
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: `Fee paid: ${FEE_ETH} ETH. Researching your question...`, timestamp: Date.now(), txHash },
      ]);
      const query = pendingQuery;
      setPendingQuery('');

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
          setStep('done');
        })
        .catch(() => {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Unable to complete research. Your fee has been collected — please try again or contact support.', timestamp: Date.now() },
          ]);
          setStep('done');
        });
    }
  }, [txHash, pendingQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step, isSendingTx]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || !isConnected || step === 'researching' || step === 'waiting-wallet' || isSendingTx) return;

    // Show user message
    setMessages((prev) => [...prev, { role: 'user', content: query, timestamp: Date.now() }]);
    setInput('');

    // If already connected on Ritual with enough balance, trigger wallet tx
    if (onRitual && hasEnoughBalance && simulateData?.request) {
      setPendingQuery(query);
      setStep('waiting-wallet');
      try {
        await writeContractAsync(simulateData.request);
      } catch {
        setPendingQuery('');
        setStep('idle');
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: 'Transaction was cancelled or failed.', timestamp: Date.now() },
        ]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isLoading = step === 'researching' || step === 'waiting-wallet' || isSendingTx;

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

      {/* Wallet Gate */}
      {!isConnected ? (
        <div style={{ padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontWeight: 600, fontSize: '1rem' }}>Connect Your Wallet</div>
          <div className="body" style={{ maxWidth: 320, textAlign: 'center' }}>
            Connect your wallet on Ritual Chain to ask AI research questions. Each question costs {FEE_ETH} ETH — fee is collected on-chain in the ResearchTreasury.
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
          <div className="body">Switch your wallet to Ritual Chain (ID: 1979) to continue.</div>
        </div>
      ) : !hasEnoughBalance ? (
        <div style={{ padding: '40px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Insufficient Balance</div>
          <div className="body">
            You need at least {FEE_ETH} ETH on Ritual Chain. Current balance: {Number(balanceFormatted).toFixed(4)} ETH
          </div>
        </div>
      ) : (
        <div>
          {/* Fee banner */}
          <div style={{ padding: '6px var(--space-5)', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)' }}>
            <Coins size={12} />
            <span>Each question costs <strong>{FEE_ETH} ETH</strong> — confirmed on-chain in treasury</span>
          </div>

          {/* Messages */}
          <div style={{ maxHeight: 400, overflowY: 'auto', padding: 'var(--space-4) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.length === 0 ? (
              <div className="caption" style={{ textAlign: 'center', padding: '20px 0' }}>
                Type a question and click send. Your wallet will ask you to confirm the {FEE_ETH} ETH fee, then you will receive a detailed research answer.
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`}>
                  <div className="chat-avatar">{msg.role === 'user' ? 'U' : msg.role === 'system' ? '⚡' : 'AI'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={`chat-text ${msg.role === 'assistant' ? 'system' : msg.role === 'system' ? '' : ''}`}
                      style={msg.role === 'assistant' ? { background: 'var(--surface)', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap' } : msg.role === 'system' ? { background: 'var(--primary-dim)', border: '1px solid rgba(124,58,237,0.2)', textAlign: 'center' } : {}}
                      dangerouslySetInnerHTML={msg.role === 'assistant' ? { __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') } : undefined}
                    >
                      {msg.role !== 'assistant' ? msg.content : undefined}
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
                          View transaction
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {(isLoading || isSendingTx) && (
              <div className="chat-bubble assistant">
                <div className="chat-avatar">AI</div>
                <div className="typing-indicator"><span /><span /><span /></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested questions */}
          {messages.length === 0 && (
            <div style={{ padding: '0 var(--space-5) var(--space-2)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-4)' }}>
            <div className="chat-input-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any question..."
                className="chat-input"
                disabled={isLoading || isSendingTx}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || isSendingTx || !input.trim()}
                className="chat-send-btn"
                style={{ background: isLoading ? 'var(--text-muted)' : 'var(--primary)' }}
              >
                {isSendingTx || step === 'waiting-wallet' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
              </button>
            </div>
            <div className="caption" style={{ textAlign: 'center', marginTop: 6, fontSize: '0.65rem' }}>
              Sending will open your wallet to pay {FEE_ETH} ETH fee
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
