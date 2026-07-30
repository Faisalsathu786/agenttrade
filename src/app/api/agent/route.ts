import { NextRequest, NextResponse } from 'next/server';
import { findKnowledge } from '@/lib/agent-knowledge';
import { AGENT_TRADER } from '@/lib/contracts';
import { ethCall, AGENT_STATE_SELECTOR, LATEST_DECISION_SELECTOR, decodeAgentState, decodeLatestDecision } from '@/lib/rpc';

export const runtime = 'edge';

interface ResearchRequest {
  query: string;
}

interface Source {
  title: string;
  url: string;
  snippet: string;
}

// ─── Web Search ────────────────────────────────────────
async function searchWeb(query: string): Promise<Source[]> {
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&skip_disambig=1`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    const sources: Source[] = [];

    // Abstract source
    if (data.AbstractText) {
      sources.push({
        title: data.AbstractSource || 'DuckDuckGo',
        url: data.AbstractURL || '',
        snippet: data.AbstractText.slice(0, 300),
      });
    }

    // Related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text) {
          sources.push({
            title: topic.Text.slice(0, 60),
            url: topic.FirstURL || '',
            snippet: topic.Text.slice(0, 300),
          });
        }
      }
    }

    return sources;
  } catch {
    return [];
  }
}

// ─── HTML scrape for deeper context ────────────────────
async function scrapeUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const html = await res.text();
    // Basic text extraction
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 2000);
  } catch {
    return '';
  }
}

// ─── RPC Agent State Check ────────────────────────────
async function getOnChainContext(): Promise<string> {
  try {
    const [stateHex, decisionHex] = await Promise.all([
      ethCall(AGENT_TRADER, AGENT_STATE_SELECTOR),
      ethCall(AGENT_TRADER, LATEST_DECISION_SELECTOR),
    ]);
    const state = decodeAgentState(stateHex);
    let ctx = `AgentTrade is live on Ritual Chain. Total on-chain decisions: ${state.totalDecisions}. Paper PnL: ${state.paperPnL}. Last activity block: ${state.lastActivityBlock}. Agent active: ${state.active}.`;

    if (state.totalDecisions > 0 && decisionHex && decisionHex !== '0x') {
      try {
        const d = decodeLatestDecision(decisionHex);
        ctx += ` Latest decision: ${d.asset} → ${d.direction} (confidence: ${d.confidence}%) at $${d.price}.`;
      } catch {}
    }
    return ctx;
  } catch {
    return 'AgentTrade contract on Ritual Chain (ID 1979) at 0x8bD4A8Aba8C77650c62730De88268cE80597E2cB.';
  }
}

// ─── Answer Generation ──────────────────────────────────
function generateAnswer(question: string, knowledge: string[], webSources: Source[]): string {
  const lower = question.toLowerCase();

  // Intent classification
  const isRitual = lower.includes('ritual') || lower.includes('chain 1979') || lower.includes('agenttrade');
  const isBtc = lower.includes('bitcoin') || (lower.includes('btc') && !lower.includes('usdt') && !lower.includes('usdc'));
  const isEth = lower.includes('ethereum') || lower.includes('eth');
  const isSol = lower.includes('solana') || lower.includes('sol');
  const isDefi = lower.includes('defi') || lower.includes('yield') || lower.includes('lending') || lower.includes('liquidity');
  const isAI = lower.includes('ai') || lower.includes('artificial intelligence') || lower.includes('machine learning') || (lower.includes('on-chain') && lower.includes('ai'));
  const isWallet = lower.includes('wallet') || lower.includes('metamask') || lower.includes('connect');
  const isPrice = lower.includes('price') || lower.includes('market') || lower.includes('trading') || lower.includes('chart');

  // Build response from knowledge base
  let knowledgeContext = '';
  if (knowledge.length > 0) {
    knowledgeContext = knowledge.join('\n\n');
  }

  // Web search results as extra context
  let webContext = '';
  if (webSources.length > 0) {
    webContext = webSources.slice(0, 3).map(s => `• ${s.title}: ${s.snippet.slice(0, 200)}`).join('\n');
  }

  // Generate structured answer
  let answer = '';
  let confidence = 0;

  if (isRitual) {
    confidence = 95;
    answer = `**Ritual Chain Overview**

Ritual Chain is a blockchain built specifically for on-chain AI applications. Currently live on testnet with Chain ID **1979**.

**Key Details:**
- Chain ID: \`1979\`
- RPC: \`https://rpc.ritualfoundation.org\`
- Explorer: \`https://explorer.ritualfoundation.org\`
- Native Currency: ETH

**AI Precompiles:** Ritual has built-in precompiles at known addresses (RitualWallet, AsyncDelivery, Scheduler) that let smart contracts run AI inference directly on-chain — no external oracles needed.

**AgentTrade:** The first autonomous trading agent on Ritual Chain, deployed at \`0x8bD4...E2cB\`. It makes on-chain BUY/SELL/HOLD decisions every 12 minutes.

${knowledgeContext ? '\n**From Knowledge Base:**\n' + knowledgeContext : ''}
${webContext ? '\n**Web Sources:**\n' + webContext : ''}`;
  } else if (isBtc) {
    confidence = 90;
    answer = `**Bitcoin (BTC)**

Bitcoin is the first and largest cryptocurrency by market cap — often called "digital gold."

**Key Facts:**
- Creator: Satoshi Nakamoto (2009)
- Max Supply: **21 million BTC**
- Consensus: Proof of Work
- Current Block Reward: **3.125 BTC**
- Next Halving: ~2028

Bitcoin's value proposition is its fixed supply and decentralized network security. Institutional adoption through Bitcoin ETFs (BlackRock, Fidelity) has been a major narrative.

${knowledgeContext ? '\n**From Knowledge Base:**\n' + knowledgeContext : ''}
${webContext ? '\n**Web Sources:**\n' + webContext : ''}`;
  } else if (isEth) {
    confidence = 90;
    answer = `**Ethereum (ETH)**

Ethereum is a decentralized "world computer" running smart contracts. It transitioned to Proof of Stake in Sep 2022.

**Key Facts:**
- Switch to Proof of Stake (The Merge)
- EIP-1559 fee mechanism (base fee burned)
- Hosts massive DeFi, NFT, and DAO ecosystem
- Layer 2 scaling: Arbitrum, Optimism, Base

ETH is the native gas token. Ethereum's main strength is its network effects — the largest developer ecosystem, most DeFi TVL, and widest institutional support.

${knowledgeContext ? '\n**From Knowledge Base:**\n' + knowledgeContext : ''}
${webContext ? '\n**Web Sources:**\n' + webContext : ''}`;
  } else if (isSol) {
    confidence = 85;
    answer = `**Solana (SOL)**

Solana is a high-performance blockchain using a unique Proof of History (PoH) consensus.

**Key Facts:**
- Capable of ~50,000 transactions per second
- Fees typically under $0.01
- Smart contracts in Rust via Anchor framework
- Popular for DePIN, meme coins, NFTs

Solana has recovered strongly from the FTX crash and is now seeing major institutional interest.

${knowledgeContext ? '\n**From Knowledge Base:**\n' + knowledgeContext : ''}
${webContext ? '\n**Web Sources:**\n' + webContext : ''}`;
  } else if (isDefi) {
    confidence = 85;
    answer = `**DeFi (Decentralized Finance)**

DeFi is a system of financial applications built on blockchain, removing intermediaries like banks.

**Core Primitives:**
- **AMMs** (Uniswap, Raydium, Orca) — automated market making via liquidity pools
- **Lending** (AAVE, Compound) — borrow and lend crypto
- **Yield Aggregators** — auto-compound yields
- **Derivatives** (GMX, dYdX) — on-chain perps and options

**Risks:** Impermanent loss, smart contract bugs, oracle manipulation, regulatory uncertainty.

${knowledgeContext ? '\n**From Knowledge Base:**\n' + knowledgeContext : ''}
${webContext ? '\n**Web Sources:**\n' + webContext : ''}`;
  } else if (isAI) {
    confidence = 90;
    answer = `**AI + Blockchain Integration**

The convergence of AI and blockchain creates autonomous, verifiable AI agents.

**How It Works:**
- Smart contracts call AI models via oracles or chain-native precompiles
- Ritual Chain is the first chain purpose-built with AI precompiles
- AI agents can execute trades, score credit, generate content, verify identity

**Key Projects:**
- **Ritual Chain** — on-chain AI infrastructure
- **Bittensor (TAO)** — decentralized ML network
- **Fetch.ai (FET)** — autonomous AI agents

The killer use case is autonomous agents that make decisions and execute them transparently on-chain. AgentTrade is a real-world example.

${knowledgeContext ? '\n**From Knowledge Base:**\n' + knowledgeContext : ''}
${webContext ? '\n**Web Sources:**\n' + webContext : ''}`;
  } else if (isWallet) {
    confidence = 80;
    answer = `**Web3 Wallets & Connection**

A Web3 wallet (MetaMask, Rainbow, Rabby, Coinbase Wallet) connects you to blockchain apps.

**How to Connect:**
1. Install a wallet extension (MetaMask recommended for Ritual Chain)
2. Add Ritual Chain (ID: 1979, RPC: https://rpc.ritualfoundation.org)
3. Click "Connect Wallet" on the app — popup opens
4. Sign the message to prove ownership
5. Pay the research fee (0.001 ETH) to ask a question

Wallet connection uses Ethereum's EIP-1193 standard. No private keys are ever shared — only signature proofs.

${knowledgeContext ? '\n**From Knowledge Base:**\n' + knowledgeContext : ''}
${webContext ? '\n**Web Sources:**\n' + webContext : ''}`;
  } else {
    // General — use web search + knowledge
    confidence = Math.min(70 + webSources.length * 5, 90);
    answer = `**Research Summary**

Based on the available information:

${knowledgeContext ? '**From Knowledge Base:**\n' + knowledgeContext + '\n\n' : ''}
${webContext ? '**Web Sources:**\n' + webContext : 'I checked multiple sources but couldn\'t find specific information on this topic. Here\'s what I know from my built-in knowledge.'}

**Tip:** For more specific results, try asking about:
- Specific cryptocurrencies (Bitcoin, Ethereum, Solana)
- Ritual Chain and on-chain AI
- DeFi protocols and yield strategies
- Smart contract security and audits`;
  }

  return answer;
}

// ─── POST Handler ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body: ResearchRequest = await request.json();
    const { query } = body;

    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please ask a meaningful question.' },
        { status: 400 }
      );
    }

    // Parallel: knowledge lookup + web search + on-chain context
    const [knowledge, webSources, onChainCtx] = await Promise.all([
      Promise.resolve(findKnowledge(query)),
      searchWeb(query),
      getOnChainContext(),
    ]);

    // Generate answer
    const answer = generateAnswer(query, knowledge, webSources);

    // Combine all sources
    const allSources: Source[] = [
      ...(knowledge.length > 0 ? [{
        title: 'AgentTrade Knowledge Base',
        url: 'https://github.com/Faisalsathu786/agenttrade',
        snippet: knowledge.slice(0, 2).join(' | ').slice(0, 300),
      }] : []),
      ...(onChainCtx ? [{
        title: 'Ritual Chain On-Chain Data',
        url: 'https://explorer.ritualfoundation.org',
        snippet: onChainCtx.slice(0, 200),
      }] : []),
      ...webSources.slice(0, 5),
    ];

    return NextResponse.json({
      answer,
      sources: allSources,
      context: onChainCtx,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Agent research error:', error);
    return NextResponse.json(
      { error: 'Research failed. Please try again.' },
      { status: 500 }
    );
  }
}
