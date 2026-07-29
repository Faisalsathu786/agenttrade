'use client';

import { useState, useRef, useEffect } from 'react';
import { Lang } from '@/lib/i18n';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: { title: string; url: string }[];
  timestamp: number;
}

const SUGGESTIONS = [
  'What is Bitcoin halving?',
  'Explain DeFi yield farming',
  'Latest crypto regulations 2026',
  'Compare ETH vs SOL scalability',
  'How does on-chain AI work?',
];

export default function AIAssistant({ lang }: { lang: Lang }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Ask me anything about crypto, trading, DeFi, or blockchain. I research and give data-backed answers.',
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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Research failed');
      }

      const data = await res.json();
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, couldn't complete research: ${e.message}. Please try again or rephrase your question.`,
          timestamp: Date.now(),
        },
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
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: expanded ? 16 : 0 }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div className="h3" style={{ margin: 0 }}>Research Assistant</div>
          <div className="caption" style={{ margin: 0 }}>
            {loading ? 'Researching...' : `${messages.filter((m) => m.role !== 'system').length} exchanges`}
          </div>
        </div>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: loading ? '#06b6d4' : 'var(--positive)',
          boxShadow: loading ? '0 0 8px rgba(6,182,212,.6)' : 'none',
          animation: loading ? 'pulse 2s infinite' : 'none',
        }} />
      </div>

      {expanded && (
        <>
          <div className="divider" style={{ marginBottom: 12 }} />

          {/* Messages */}
          <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', maxHeight: '360px', paddingRight: 4 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`} style={{ marginBottom: 16 }}>
                <div className="chat-avatar">
                  {msg.role === 'user' ? '👤' : msg.role === 'system' ? '🤖' : '🔬'}
                </div>
                <div className="chat-content" style={{ flex: 1 }}>
                  <div className={`chat-text ${msg.role}`}>
                    {msg.content}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {msg.sources.map((s, j) => (
                        <a
                          key={j}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="source-chip"
                        >
                          📎 {s.title.slice(0, 40)}{s.title.length > 40 ? '...' : ''}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-bubble assistant" style={{ marginBottom: 16 }}>
                <div className="chat-avatar">🔬</div>
                <div className="chat-content">
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Suggestions (only when no user messages yet) */}
          {messages.filter((m) => m.role === 'user').length === 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, marginTop: 8 }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSend(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-row">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything — I'll research and explain..."
              className="chat-input"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="chat-send-btn"
            >
              {loading ? '⏳' : '➤'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
