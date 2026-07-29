// ─── AgentTrade — Contract ABIs & Addresses ────────────

// Ritual Chain 1979 — testnet
export const RITUAL_CHAIN_ID = 1979;
export const RITUAL_RPC = 'https://rpc.ritualfoundation.org';
export const RITUAL_EXPLORER = 'https://explorer.ritualfoundation.org';

// System contracts
export const RITUAL_WALLET   = '0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948';
export const ASYNC_DELIVERY  = '0x5A16214fF555848411544b005f7Ac063742f39F6';
export const SCHEDULER       = '0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B';

// AgentTrader V4 — deployed on Ritual testnet (with decision engine)
export const AGENT_TRADER = '0x8bD4A8Aba8C77650c62730De88268cE80597E2cB';

export const AGENT_TRADER_ABI = [
  // State
  'function agent() view returns (tuple(uint32 totalDecisions, int256 paperPnL, uint256 lastActivityBlock, bool active))',
  'function getAgentState() view returns (tuple(uint32 totalDecisions, int256 paperPnL, uint256 lastActivityBlock, bool active))',
  'function getDecisionCount() view returns (uint256)',
  'function getLatestDecision() view returns (tuple(uint8 asset, uint256 price, uint8 direction, uint8 confidence, string reason, uint256 timestamp))',
  'function getPriceCount() view returns (uint256)',
  'function getLatestPrice() view returns (tuple(uint8 asset, uint256 price, uint256 timestamp))',
  'function AGENT_NAME() view returns (string)',
  'function AGENT_VERSION() view returns (string)',

  // Actions
  'function fetchPrice(uint256 asset) returns (bytes32)',
  'function makeDecision(uint256 asset) returns (uint256)',

  // Events
  'event PriceFetched(uint8 indexed asset, uint256 price, uint256 timestamp)',
  'event DecisionMade(uint8 indexed asset, uint8 direction, uint8 confidence, uint256 price, uint256 timestamp)',
  'event AgentInitialized(address indexed owner, string name)',
] as const;

// Asset mapping
export const ASSETS = {
  BTC: { id: 1, label: 'BTC', name: 'Bitcoin', color: '#f7931a' },
  ETH: { id: 2, label: 'ETH', name: 'Ethereum', color: '#627eea' },
  SOL: { id: 3, label: 'SOL', name: 'Solana',  color: '#00ffa3' },
} as const;

export type AssetKey = keyof typeof ASSETS;
export type AssetInfo = typeof ASSETS[AssetKey];

export function assetInfo(assetId: number): AssetInfo | null {
  for (const key of Object.keys(ASSETS) as AssetKey[]) {
    if (ASSETS[key].id === assetId) return ASSETS[key];
  }
  return null;
}

export const DIRECTION_LABELS: Record<number, string> = {
  0: 'HOLD',
  1: 'BULLISH',
  2: 'BEARISH',
};
