// ─── ResearchTreasury — Contract Interaction ──────────
import { Address, encodeFunctionData, decodeFunctionResult, createPublicClient, http } from 'viem';

export const TREASURY_ADDRESS = '0x9385556B571ab92bf6dC9a0DbD75429Dd4d56F91'; // UUPS Proxy, Ritual Chain 1979

export const TREASURY_ABI = [
  {
    inputs: [{ internalType: 'address', name: '_owner', type: 'address' }],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'question', type: 'string' }],
    name: 'payForQuery',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'queryCost',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'feePerQuery',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalQueries',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalCollected',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'userQueryCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'userTotalSpent',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address payable', name: 'to', type: 'address' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address payable', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'withdrawPartial',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_newFee', type: 'uint256' }],
    name: 'setFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'user', type: 'address' }, { indexed: false, internalType: 'string', name: 'question', type: 'string' }, { indexed: false, internalType: 'uint256', name: 'fee', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' }],
    name: 'QueryPaid',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'to', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'Withdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint256', name: 'oldFee', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'newFee', type: 'uint256' }],
    name: 'FeeUpdated',
    type: 'event',
  },
] as const;

export const RITUAL_RPC = 'https://rpc.ritualfoundation.org';

const publicClient = createPublicClient({
  transport: http(RITUAL_RPC),
});

/** Fetch fee per query from contract */
export async function getFeePerQuery(): Promise<bigint> {
  try {
    return await publicClient.readContract({
      address: TREASURY_ADDRESS as Address,
      abi: TREASURY_ABI,
      functionName: 'feePerQuery',
    }) as bigint;
  } catch { return BigInt('1000000000000000'); } // fallback 0.001 ETH
}

/** Fetch total collected */
export async function getTotalCollected(): Promise<bigint> {
  try {
    return await publicClient.readContract({
      address: TREASURY_ADDRESS as Address,
      abi: TREASURY_ABI,
      functionName: 'totalCollected',
    }) as bigint;
  } catch { return BigInt(0); }
}

/** Fetch owner */
export async function getTreasuryOwner(): Promise<Address> {
  try {
    return await publicClient.readContract({
      address: TREASURY_ADDRESS as Address,
      abi: TREASURY_ABI,
      functionName: 'owner',
    }) as Address;
  } catch { return '0x0000000000000000000000000000000000000000' as Address; }
}
