'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ExternalLink } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: { title: string; url: string }[];
  timestamp: number;
}

const SUGGESTIONS = [
  'Explain Bitcoin halving and its market impact',
  'How does DeFi yield farming work?',
  'Latest crypto regulatory developments',
  'Compare Ethereum vs Solana scalability',
  'How do on-chain AI agents work?',
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Ask any question about crypto, trading, DeFi, or blockchain technology.',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = (text || input).trim();
    if (!query || loading) return;

    const userMsg: Message = { role: 'user', content: query, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error('Research failed');

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources, timestamp: Date.now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Unable to complete research. Please try again.', timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: 'var(--space-5)', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div className="card-header" style={{ marginBottom: 0 }}>
          <span className="card-title">Research Assistant</span>
          {loading ? (
            <span className="badge badge-primary">
              <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
              Searching
            </span>
          ) : (
            <span className="badge badge-success">Ready</span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="chat-container" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="chat-messages" style={{ padding: 'var(--space-4)', maxHeight: 320 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>
                <div className="chat-avatar">
                  {msg.role === 'user' ? 'U' : msg.role === 'system' ? 'AI' : 'R'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={`chat-text ${msg.role}`}>
                    {msg.content}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {msg.sources.map((s, j) => (
                        <a key={j} href={s.url} target="_blank" rel="noopener noreferrer" className="source-chip">
                          <ExternalLink size={10} />
                          {s.title.slice(0, 35)}{s.title.length > 35 ? '...' : ''}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-bubble assistant">
                <div className="chat-avatar">R</div>
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {messages.filter((m) => m.role === 'user').length === 0 && (
            <div style={{ padding: '0 var(--space-4) var(--space-2)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-4)' }}>
            <div className="chat-input-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="chat-input"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="chat-send-btn"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
