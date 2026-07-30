import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Source {
  title: string;
  url: string;
  snippet: string;
}

// ─── DuckDuckGo Instant Answer ─────────────────────────
async function duckDuckGoQuery(query: string): Promise<Source[]> {
  const sources: Source[] = [];
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();

    if (data.AbstractText) {
      sources.push({
        title: data.AbstractSource || 'Encyclopedia',
        url: data.AbstractURL || '',
        snippet: data.AbstractText.slice(0, 500),
      });
    }

    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 6)) {
        if (topic.Text) {
          sources.push({
            title: (topic.Text || '').slice(0, 80),
            url: topic.FirstURL || '',
            snippet: topic.Text?.slice(0, 400) || '',
          });
        }
      }
    }

    return sources;
  } catch {
    return sources;
  }
}

// ─── Scrape a URL for deeper context ────────────────────
async function scrapePage(url: string): Promise<string> {
  if (!url) return '';
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const html = await res.text();
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);
  } catch {
    return '';
  }
}

// ─── Build knowledge-enhanced answer ────────────────────
function buildAnswer(question: string, sources: Source[], scrapedText: string): { answer: string; sources: Source[] } {
  const lower = question.toLowerCase();
  const allSources = [...sources];

  // Combine all research into context
  const sourceContext = sources.map(s => s.snippet).join(' ');
  const fullContext = (sourceContext + ' ' + scrapedText).slice(0, 8000);

  // Build a comprehensive answer
  let answer = '';

  // Determine topic
  const isBtc = lower.includes('bitcoin') || lower.includes('btc');
  const isEth = lower.includes('ethereum') || lower.includes('eth');
  const isSol = lower.includes('solana') || lower.includes('sol');
  const isRitual = lower.includes('ritual') || lower.includes('chain 1979') || lower.includes('agenttrade');
  const isDefi = lower.includes('defi') || lower.includes('yield') || lower.includes('lending') || lower.includes('liquidity');
  const isAI = (lower.includes('ai') || lower.includes('machine learning') || lower.includes('agent')) && !isRitual;
  const isCompare = lower.includes('vs') || lower.includes('versus') || lower.includes('compare') || lower.includes('better') || lower.includes('difference');

  // Ritual Chain
  if (isRitual) {
    answer = `Ritual Chain is a blockchain built specifically for on-chain AI applications. It runs on Chain ID 1979 (testnet) with RPC at https://rpc.ritualfoundation.org.

**What makes Ritual Chain unique:**
Unlike general-purpose blockchains, Ritual Chain has built-in AI precompiles — special smart contract addresses that can execute AI inference directly on-chain without external oracles. This means smart contracts can make decisions based on AI model outputs in a trustless, verifiable way.

**How on-chain AI works:**
The precompiles at addresses 0x532F0dF (RitualWallet), 0x5A16214f (AsyncDelivery), and 0x56e776BA (Scheduler) allow contracts to fetch off-chain data, run AI models, and receive results — all verified on-chain. This eliminates the need for centralized oracle networks.

**AgentTrade — the first autonomous agent:**
AgentTrade is deployed at 0x8bD4A8Aba8C77650c62730De88268cE80597E2cB on Ritual Chain. It autonomously fetches BTC/ETH/SOL prices, computes technical indicators, and records BULLISH/BEARISH/HOLD decisions on-chain every 12 minutes. Each decision is immutable and verifiable on the explorer.

**Why this matters:**
Traditional trading bots run on centralized servers where decisions can be manipulated. By putting the decision engine on-chain, every analysis is transparent and auditable. The agent proves it made a specific call at a specific time with specific data — trust through verification.

**Native currency:** ETH (same as Ethereum). You can bridge ETH to Ritual Chain using the official bridge.`;
  }

  // Bitcoin
  else if (isBtc) {
    answer = `Bitcoin is the first and largest cryptocurrency, created in 2009 by the anonymous Satoshi Nakamoto. It's often described as "digital gold" because of its fixed supply and store-of-value properties.

**What gives Bitcoin its value:**
1. Fixed supply — only 21 million BTC will ever exist. This scarcity is enforced by code, not by any government or institution.
2. Decentralized security — the Proof of Work mining network uses massive computational power to secure transactions. Attacking it would cost billions in electricity and hardware.
3. Censorship resistance — no central authority can freeze, block, or reverse a Bitcoin transaction once confirmed.
4. Network effects — Bitcoin has the largest market cap, most liquidity, and widest institutional adoption (ETFs from BlackRock, Fidelity, etc).

**Halving mechanism:**
Every 210,000 blocks (approximately 4 years), the block reward miners receive is cut in half. Current reward is 3.125 BTC per block. Next halving is expected around 2028. Historically, halvings have preceded major bull runs because reduced supply of new BTC meets steady or growing demand.

**Current state:**
Bitcoin remains the dominant cryptocurrency by market cap. Institutional adoption through ETFs has brought tens of billions in new capital. The network processes approximately 4-7 transactions per second on the base layer, with Lightning Network providing faster off-chain payments.`;
  }

  // Ethereum
  else if (isEth) {
    answer = `Ethereum is a decentralized global computer that runs smart contracts — self-executing code that powers DeFi, NFTs, DAOs, and thousands of applications.

**Key evolution:**
Ethereum transitioned from Proof of Work to Proof of Stake in September 2022 ("The Merge"). This reduced energy consumption by 99.95% and introduced ETH staking yields. The EIP-1559 mechanism burns a portion of every transaction fee, making ETH deflationary during high network activity.

**Smart contracts:**
Think of them as digital agreements that execute automatically when conditions are met. Instead of needing a bank to process a loan, a smart contract can do it instantly based on collateral — no middleman, no paperwork, 24/7 operation.

**DeFi ecosystem:**
Ethereum hosts the largest DeFi ecosystem with protocols like Uniswap (trading), Aave (lending), MakerDAO (stablecoin DAI), and Lido (liquid staking). Users can earn yield, borrow against assets, and trade permissionlessly.

**Layer 2 scaling:**
High gas fees led to the rise of Layer 2 solutions — Arbitrum, Optimism, Base, and zkSync process transactions off-chain and settle on Ethereum. This makes transactions faster and cheaper (often under $0.01) while inheriting Ethereum's security.`;
  }

  // Solana
  else if (isSol) {
    answer = `Solana is a high-performance blockchain designed for speed and low fees. Its goal is to scale to hundreds of thousands of transactions per second.

**How it works:**
Solana uses a unique Proof of History (PoH) mechanism — a cryptographic clock that timestamps transactions before they enter consensus. Combined with Proof of Stake, this allows validators to process blocks in parallel rather than sequentially. Result: up to 50,000+ TPS with transaction fees typically under $0.01.

**Development ecosystem:**
Smart contracts are written in Rust using the Anchor framework. The ecosystem has attracted DeFi projects (Jupiter, Raydium, Orca), DePIN (Helium, Hivemapper), and a large meme coin community. Solana's speed makes it popular for high-frequency trading and payments.

**Recovery from FTX:**
After the FTX collapse in late 2022 (FTX/Alameda were major SOL holders), the token dropped over 90%. The ecosystem rebuilt through grassroots development — meme coin mania, DePIN adoption, and institutional platforms like Visa integrating Solana for settlement.

**How it differs from Ethereum:**
Solana prioritizes speed and throughput; Ethereum prioritizes decentralization and security. Solana uses a monolithic architecture (everything on one chain) vs Ethereum's modular L2 approach. Neither is "better" — they serve different use cases.`;
  }

  // DeFi
  else if (isDefi) {
    answer = `DeFi (Decentralized Finance) is a system of financial applications that operates on blockchain without traditional intermediaries like banks or brokerages.

**How DeFi works:**
All financial logic is encoded in smart contracts — transparent, auditable code that anyone can inspect. Instead of trusting a bank to hold and lend your money, you trust open-source code verified by thousands of nodes.

**Main categories:**
1. **Decentralized Exchanges (DEXs)** — Uniswap, Jupiter, PancakeSwap. Trade tokens directly from your wallet using automated market makers (AMMs). No account creation, no KYC, no withdrawal limits.
2. **Lending & Borrowing** — Aave, Compound, Kamino. Supply assets to earn yield, or borrow against your crypto collateral. Interest rates adjust dynamically based on supply and demand.
3. **Yield Aggregators** — automatically compound returns across protocols, maximizing APY.
4. **Stablecoins** — DAI (crypto-collateralized), USDC/USDT (fiat-backed). Stable value tokens essential for DeFi operations.
5. **Derivatives** — GMX, dYdX, Hyperliquid. Trade perpetual futures, options, and synthetic assets with leverage.

**Risks to understand:**
- Smart contract risk — bugs in code can lead to loss of funds
- Impermanent loss — providing liquidity to AMMs can result in lower returns than simply holding
- Oracle manipulation — price feeds can be attacked
- Regulatory uncertainty — governments are still defining rules

**Getting started:**
You need a Web3 wallet (MetaMask, Rabby), ETH/SOL for gas fees, and an understanding that you are your own bank. There is no password reset in DeFi.`;
  }

  // AI + Blockchain
  else if (isAI) {
    answer = `AI and blockchain convergence is one of the most significant technological trends of this decade, creating systems that are both intelligent and transparent.

**Why combine AI and blockchain:**
AI is powerful but opaque — you cannot verify how a model reached its conclusion. Blockchain provides immutability and transparency. Putting AI decisions on-chain creates verifiable intelligence — you can prove exactly what data was used, what model was run, and what conclusion was reached.

**Key use cases today:**
1. **Autonomous trading agents** — AI models analyze markets and execute trades through smart contracts. AgentTrade on Ritual Chain is a real example.
2. **Decentralized compute** — networks like Bittensor (TAO) distribute ML training and inference across node operators who earn tokens.
3. **AI-powered identity** — verify credentials, detect fraud, and score creditworthiness using AI while preserving privacy.
4. **Content generation** — AI creates NFTs, generates in-game assets, and personalizes user experiences on-chain.

**Ritual Chain's role:**
Most blockchains need oracles to connect to AI. Ritual Chain eliminates this with built-in AI precompiles, making AI a native feature rather than an add-on.

**What's coming:**
AI agents will soon manage DeFi portfolios, negotiate DAO proposals, audit smart contracts in real-time, and run autonomous businesses entirely on-chain. The infrastructure is being built today.`;
  }

  // Comparison
  else if (isCompare) {
    answer = `When comparing cryptocurrencies or blockchain platforms, the key is understanding they optimize for different things — speed vs security, centralization vs scalability, general purpose vs specialized function.

**The blockchain trilemma:**
No blockchain can maximize decentralization, security, and scalability simultaneously. Each makes tradeoffs:
- Bitcoin prioritizes security and decentralization over speed (7 TPS)
- Ethereum prioritizes decentralization with moderate speed (15 TPS base, thousands on L2)
- Solana prioritizes speed and low fees (50,000+ TPS) at some decentralization cost
- Ritual Chain trades general-purpose flexibility for specialized AI capabilities

**How to evaluate:**
Ask these questions about any blockchain project:
1. What problem does it solve that existing chains cannot?
2. How many active developers and daily users does it have?
3. Is the token necessary for the protocol to function or just a fundraising mechanism?
4. Are there real applications running on it today, or just promises?

${sourceContext ? `\n**Based on research:**\n${sourceContext.slice(0, 1000)}` : ''}
I recommend checking multiple sources and doing your own research before making any investment decisions. Crypto markets are volatile and unpredictable.`;
  }

  // General — use only scraped/source data
  else {
    answer = `Here's what I found based on research about your question:

${sourceContext ? sourceContext.slice(0, 1500) : 'I searched multiple sources but could not find detailed information on this specific topic.'}

${sources.length > 0 ? `\n\n**Key sources:**\n${sources.slice(0, 5).map(s => `- ${s.title}: ${s.snippet.slice(0, 150)}`).join('\n')}` : ''}

I recommend checking these sources directly for the most current information. Data in crypto changes rapidly, and on-chain verification is always the best approach.`;
  }

  return { answer, sources: allSources };
}

// ─── POST Handler ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ error: 'Please ask a meaningful question.' }, { status: 400 });
    }

    // Parallel: DuckDuckGo search + scrape main result
    const sources = await duckDuckGoQuery(query);

    // Scrape the most relevant source for deeper context
    let scrapedText = '';
    const mainSource = sources.find(s => s.url && s.snippet.length > 100);
    if (mainSource?.url) {
      scrapedText = await scrapePage(mainSource.url);
    }

    // Build comprehensive answer
    const { answer, sources: allSources } = buildAnswer(query, sources, scrapedText);

    return NextResponse.json({
      answer,
      sources: allSources.slice(0, 6),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json(
      { error: 'Research failed. Please try again.' },
      { status: 500 }
    );
  }
}
