# AgentTrade

Autonomous trading agent built on Ritual Chain — on-chain decision engine, AI-powered market analysis, and real-time dashboard.

## Architecture

```
Smart Contract (Ritual Chain)  →  AgentTrader.sol stores every decision on-chain
Auto-Agent (Cron Engine)       →  Fetches prices, computes indicators, records BULLISH/BEARISH/HOLD
AI Model (Adaption)            →  Trained on 3,767 rows of hourly BTC/ETH/SOL data
Dashboard (Next.js)            →  Real-time market data, on-chain decisions, research assistant
```

## Stack

- **Frontend**: Next.js 16, React 19, TypeScript, CSS Modules
- **Styling**: Tailwind CSS 3, Inter + JetBrains Mono fonts
- **Icons**: Lucide React
- **Smart Contract**: Solidity 0.8.28, Foundry, Ritual Chain testnet (ID 1979)
- **AI**: Adaption AutoScientist, DuckDuckGo research API
- **Data**: CoinGecko API, on-chain RPC queries

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Smart Contracts

```bash
cd contracts
forge build
forge script script/Deploy.s.sol:DeployAgentTrader --rpc-url $RITUAL_RPC --broadcast
```

**Deployed**: `0x8bD4A8Aba8C77650c62730De88268cE80597E2cB` on Ritual Chain (1979)

## Project Structure

```
src/
├── app/                  # Next.js app router
│   ├── api/research/     # AI research endpoint
│   ├── globals.css       # Design system
│   ├── layout.tsx        # Root layout + fonts
│   └── page.tsx          # Dashboard page
├── components/
│   ├── dashboard/        # 7 dashboard components
│   └── layout/           # Sidebar + Topbar
└── lib/                  # Contracts, RPC helpers, i18n
contracts/
├── src/AgentTrader.sol   # On-chain decision engine
├── script/Deploy.s.sol   # Deployment script
└── foundry.toml
```

## License

MIT
