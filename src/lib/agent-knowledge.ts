/**
 * AgentTrade — Ritual Chain & Crypto Knowledge Base
 * Used by the AI Research Agent for context-aware answers
 */

export interface KnowledgeEntry {
  topic: string;
  keywords: string[];
  content: string;
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ─── Ritual Chain ──────────────────────────────────────
  {
    topic: 'Ritual Chain Overview',
    keywords: ['ritual', 'ritual chain', 'ritual foundation', 'what is ritual', 'ritual chain id', '1979'],
    content: `Ritual Chain is a blockchain designed for on-chain AI. Chain ID: 1979 (testnet). RPC: https://rpc.ritualfoundation.org. Explorer: https://explorer.ritualfoundation.org. It features AI precompiles (infernet) that allow smart contracts to make AI inferences directly on-chain. Native currency is ETH.`,
  },
  {
    topic: 'Ritual Chain Precompiles',
    keywords: ['precompile', 'infernet', 'ai precompile', 'ritual precompile', 'on-chain ai'],
    content: `Ritual Chain has built-in AI precompiles at addresses: 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948 (RitualWallet), 0x5A16214fF555848411544b005f7Ac063742f39F6 (AsyncDelivery), 0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B (Scheduler). These precompiles enable smart contracts to fetch off-chain data and run AI models without external oracles.`,
  },
  {
    topic: 'AgentTrade',
    keywords: ['agenttrade', 'agent trade', 'agenttrader', 'faisal', 'dashboard', 'auto agent'],
    content: `AgentTrade is an autonomous trading agent deployed on Ritual Chain testnet (ID 1979). Contract: 0x8bD4A8Aba8C77650c62730De88268cE80597E2cB. It makes on-chain BULLISH/BEARISH/HOLD decisions every 12 minutes using price feeds. Built by Faisal Sathu.`,
  },
  {
    topic: 'ResearchTreasury',
    keywords: ['treasury', 'research treasury', 'fee', 'agent fee', 'admin withdraw', 'research fee'],
    content: `ResearchTreasury is a UUPS upgradeable contract that collects fees (default 0.001 ETH per query) for the AI Research Agent. The owner can withdraw accumulated fees, set the fee rate, pause the system, and upgrade the contract. Proxy pattern ensures user data is preserved across upgrades.`,
  },

  // ─── Crypto General ────────────────────────────────────
  {
    topic: 'Bitcoin (BTC)',
    keywords: ['bitcoin', 'btc', 'bitcoin halving', 'btc supply', 'bitcoin mining', 'digital gold'],
    content: `Bitcoin is the first cryptocurrency, created by Satoshi Nakamoto in 2009. Max supply: 21 million BTC. Consensus: Proof of Work (PoW). Known as "digital gold". Halving occurs every ~210,000 blocks (~4 years), reducing block rewards by 50%. Current block reward: 3.125 BTC. Next halving: ~2028.`,
  },
  {
    topic: 'Ethereum (ETH)',
    keywords: ['ethereum', 'eth', 'ether', 'smart contract', 'evm', 'defi', 'ethereum 2.0', 'proof of stake', 'pos'],
    content: `Ethereum is a decentralized global computer with smart contract functionality. Transitioned from PoW to Proof of Stake (PoS) in Sep 2022 ("The Merge"). ETH is the native currency for gas fees. The platform hosts DeFi, NFTs, DAOs. Current gas fee model: EIP-1559 burns base fees. Layer 2 solutions (Arbitrum, Optimism, Base) scale Ethereum.`,
  },
  {
    topic: 'Solana (SOL)',
    keywords: ['solana', 'sol', 'solana speed', 'solana tps', 'proof of history', 'poh'],
    content: `Solana is a high-performance blockchain using Proof of History (PoH) + Proof of Stake consensus. Capable of ~50,000 TPS. Low transaction fees (<$0.01). Supports smart contracts via Rust/Anchor. Known for DePIN, meme coins, and NFTs.`,
  },
  {
    topic: 'DeFi (Decentralized Finance)',
    keywords: ['defi', 'decentralized finance', 'yield farming', 'liquidity pool', 'amm', 'lending', 'staking'],
    content: `DeFi is a system of financial applications built on blockchain networks (mainly Ethereum). Key primitives: AMMs (Uniswap, Raydium), Lending (AAVE, Compound), Yield Aggregators, Derivatives (GMX, dYdX). TVL measures total value locked. Risks include impermanent loss, smart contract bugs, oracle manipulation.`,
  },
  {
    topic: 'Layer 2 (L2) and Scaling',
    keywords: ['layer 2', 'l2', 'arbitrum', 'optimism', 'base', 'zksync', 'rollup', 'optimistic rollup', 'zk rollup', 'scaling'],
    content: `Layer 2 solutions scale blockchains by processing transactions off-chain and settling on L1. Two main types: Optimistic Rollups (Arbitrum, Optimism, Base) assume validity by default with a challenge period. ZK-Rollups (zkSync, StarkNet) use zero-knowledge proofs for instant finality. Both drastically reduce gas costs.`,
  },
  {
    topic: 'Stablecoins',
    keywords: ['stablecoin', 'usdc', 'usdt', 'dai', 'usde', 'stable', 'fiat-backed', 'overcollateralized'],
    content: `Stablecoins maintain a 1:1 peg to fiat currency (usually USD). Types: Fiat-backed (USDC by Circle, USDT by Tether), Crypto-collateralized (DAI by MakerDAO), Algorithmic (UST - failed). USDC is the preferred stablecoin in DeFi for its regulatory compliance and full reserves.`,
  },
  {
    topic: 'AI + Blockchain / On-Chain AI',
    keywords: ['ai blockchain', 'on-chain ai', 'ai agent', 'crypto ai', 'decentralized ai', 'ai model blockchain', 'ritual ai'],
    content: `AI + blockchain convergence creates autonomous agents that can execute smart contracts based on AI decisions. Ritual Chain is purpose-built for this with AI precompiles. Other projects: Fetch.ai (FET), SingularityNET (AGIX), Bittensor (TAO). Use cases: automated trading, credit scoring, fraud detection, generative NFTs.`,
  },
  {
    topic: 'Smart Contract Security',
    keywords: ['smart contract audit', 'reentrancy', 'flash loan attack', 'oracle manipulation', 'rug pull', 'honeypot', 'contract security'],
    content: `Common smart contract vulnerabilities: Reentrancy attacks, oracle manipulation, flash loan attacks, front-running, access control bugs. Best practices: use OpenZeppelin contracts, implement reentrancy guards, use timelocks for admin functions, get professional audits, test extensively on testnets.`,
  },
];

/**
 * Find knowledge base entries matching a user query
 */
export function findKnowledge(query: string): string[] {
  const lower = query.toLowerCase();
  const results: string[] = [];

  for (const entry of KNOWLEDGE_BASE) {
    const matchCount = entry.keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount > 0) {
      results.push(`[${entry.topic}] ${entry.content}`);
    }
  }

  return results;
}

/**
 * Get Ritual Chain specific knowledge
 */
export function getRitualKnowledge(): string {
  return KNOWLEDGE_BASE
    .filter(e => e.keywords.includes('ritual'))
    .map(e => `${e.topic}: ${e.content}`)
    .join('\n\n');
}
