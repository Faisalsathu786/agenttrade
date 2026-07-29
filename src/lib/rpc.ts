// ─── Simple Ethereum JSON-RPC client ───────────────────

export const RPC_URL = 'https://rpc.ritualfoundation.org';

export async function rpcCall(method: string, params: unknown[] = []): Promise<unknown> {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

/** Call a contract view function — returns hex-encoded result */
export async function ethCall(to: string, data: string): Promise<string> {
  const result = await rpcCall('eth_call', [{ to, data }, 'latest']);
  return result as string;
}

/** Get current block number */
export async function getBlockNumber(): Promise<number> {
  const hex = await rpcCall('eth_blockNumber');
  return parseInt(hex as string, 16);
}

/** Decode ABI-encoded tuple from getAgentState(): (uint32, int256, uint256, bool) */
export function decodeAgentState(hex: string) {
  const raw = hex.replace('0x', '');
  const totalDecisions = parseInt(raw.substring(0, 64), 16);
  const pnlHex = raw.substring(64, 128);
  const firstByte = parseInt(pnlHex.substring(0, 2), 16);
  let paperPnL: number;
  if (firstByte >= 0x80) {
    const absVal = BigInt('0x' + pnlHex) * BigInt(-1);
    paperPnL = -Number(absVal / BigInt('1000000000000000000'));
  } else {
    paperPnL = Number(BigInt('0x' + pnlHex) / BigInt('1000000000000000000'));
  }
  const lastActivityBlock = parseInt(raw.substring(128, 192), 16);
  const active = parseInt(raw.substring(192, 256), 16) === 1;
  return { totalDecisions, paperPnL, lastActivityBlock, active };
}

/** Decode the latest decision from getLatestDecision() */
export function decodeLatestDecision(hex: string) {
  const raw = hex.replace('0x', '');
  // Struct ABI: (offset, asset, price, direction, confidence, reason_offset, timestamp, reason_len)
  // 0x00 = struct offset (32 bytes) → skip
  // 0x20 = asset
  // 0x40 = price
  // 0x60 = direction
  // 0x80 = confidence
  // 0xA0 = reason offset
  // 0xC0 = timestamp
  const asset = parseInt(raw.substring(64, 128), 16);
  const price = parseInt(raw.substring(128, 192), 16);
  const direction = parseInt(raw.substring(192, 256), 16);
  const confidence = parseInt(raw.substring(256, 320), 16);
  const timestamp = parseInt(raw.substring(384, 448), 16);
  
  const dirLabels = ['HOLD', 'BULLISH', 'BEARISH'];
  const tsMs = timestamp * 1000;
  return {
    asset: ['?', 'BTC', 'ETH', 'SOL'][asset] || '?',
    assetId: asset,
    price,
    direction: dirLabels[direction] || 'HOLD',
    directionNum: direction,
    confidence,
    timestamp,
    age: Math.floor((Date.now() - tsMs) / 60000),
  };
}

/** ABI-encode fetchPrice(uint256) */
export function encodeFetchPrice(assetId: number): string {
  const sig = '0x1559f782'; // keccak256("fetchPrice(uint256)") first 4 bytes
  const param = assetId.toString(16).padStart(64, '0');
  return sig + param;
}

/** ABI for getAgentState() — selector 0x39fdf729 */
export const AGENT_STATE_SELECTOR = '0x39fdf729';

/** ABI for getDecisionCount() — selector 0x7f7e29e7 */
export const DECISION_COUNT_SELECTOR = '0x7f7e29e7';

/** ABI for getLatestDecision() — selector 0x7e3f56b7 */
export const LATEST_DECISION_SELECTOR = '0x7e3f56b7';

/** ABI-encode makeDecision(uint256) — selector 0xc6e9dc24 */
export function encodeMakeDecision(assetId: number): string {
  const sig = '0xc6e9dc24'; // keccak256("makeDecision(uint256)") first 4 bytes
  const param = assetId.toString(16).padStart(64, '0');
  return sig + param;
}
