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
  // Simple int256 decoder: check sign bit, convert to number (18 decimals)
  const firstByte = parseInt(pnlHex.substring(0, 2), 16);
  let paperPnL: number;
  if (firstByte >= 0x80) {
    // Negative — two's complement
    const absVal = BigInt('0x' + pnlHex) * BigInt(-1);
    paperPnL = -Number(absVal / BigInt('1000000000000000000'));
  } else {
    paperPnL = Number(BigInt('0x' + pnlHex) / BigInt('1000000000000000000'));
  }
  const lastActivityBlock = parseInt(raw.substring(128, 192), 16);
  const active = parseInt(raw.substring(192, 256), 16) === 1;
  return { totalDecisions, paperPnL, lastActivityBlock, active };
}

/** ABI-encode fetchPrice(uint256) */
export function encodeFetchPrice(assetId: number): string {
  const sig = '0x1559f782'; // keccak256("fetchPrice(uint256)") first 4 bytes
  const param = assetId.toString(16).padStart(64, '0');
  return sig + param;
}

/** ABI for getAgentState() — selector 0x39fdf729 */
export const AGENT_STATE_SELECTOR = '0x39fdf729';
