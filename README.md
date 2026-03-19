# Bifrost SLPx CLI

CLI tool for Bifrost liquid staking — query rates, APY, TVL, balances, redemption status; stake ETH, redeem vETH, claim redeemed ETH.

Supports **10 vTokens**: vETH, vDOT, vKSM, vBNC, vGLMR, vMOVR, vFIL, vASTR, vMANTA, vPHA.

EVM on-chain operations on **Ethereum, Base, Optimism, Arbitrum** (vETH only).

## Prerequisites

- Node.js v18+
- npm (for dependencies)
- Bun (optional, for development/testing)

## Install

```bash
npm install
npm run build
```

## Usage

```bash
node dist/index.js <command> [args] [options]
```

### Commands

| Command | Description | All vTokens? |
|---------|-------------|-------------|
| `rate [amount]` | Query exchange rate (default: 1) | Yes |
| `apy` | Query staking APY | Yes |
| `info` | Protocol overview (rate, APY, TVL, holders) | Yes |
| `balance <address>` | Query vETH balance | vETH only |
| `status <address>` | Redemption queue status | vETH only |
| `mint <amount>` | Stake ETH to mint vETH | vETH only |
| `redeem <amount>` | Redeem vETH (enters processing queue) | vETH only |
| `claim` | Claim completed ETH redemptions | vETH only |

### Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `--token <name>` | vToken name | `vETH` |
| `--chain <name>` | EVM chain (ethereum/base/optimism/arbitrum) | `ethereum` |
| `--rpc <url>` | Custom RPC endpoint | auto per chain |
| `--json` | Output as JSON | `false` |

### Transaction Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Output unsigned tx without sending |
| `--address <addr>` | Wallet address (for redeem/claim without key file) |

### Examples

```bash
# Query all vTokens
node dist/index.js rate --json
node dist/index.js rate 10 --token vDOT --json
node dist/index.js apy --token vKSM --json
node dist/index.js info --token vMANTA --json

# vETH on-chain
node dist/index.js balance 0x742d...bD18 --json
node dist/index.js mint 0.1 --dry-run --json
node dist/index.js balance 0x742d...bD18 --chain base --json

# Multi-chain
node dist/index.js mint 0.1 --dry-run --chain arbitrum --json
```

## Supported Tokens

| Token | Base Asset | APY | Query | On-chain |
|-------|-----------|-----|-------|----------|
| vETH | ETH | ~8% | Yes | Yes |
| vDOT | DOT | ~5% | Yes | No |
| vKSM | KSM | ~12% | Yes | No |
| vBNC | BNC | ~2% | Yes | No |
| vGLMR | GLMR | ~8% | Yes | No |
| vMOVR | MOVR | ~17% | Yes | No |
| vFIL | FIL | ~13% | Yes | No |
| vASTR | ASTR | ~10% | Yes | No |
| vMANTA | MANTA | ~15% | Yes | No |
| vPHA | PHA | ~9% | Yes | No |

## Wallet Setup

The CLI reads private keys from `~/.bifrost/key` (never exposed to LLM or output).

```bash
echo "0xYOUR_PRIVATE_KEY" > ~/.bifrost/key
chmod 600 ~/.bifrost/key
```

Without a key file, transaction commands output unsigned tx data for manual signing.

## Development

```bash
# Dev (requires bun)
bun src/index.ts rate --json

# Build
npm run build

# Test (requires bun)
bun test
```

## Tests

### Run All Tests

```bash
bun test
```

### Test Categories

| Category | Files | Tests | What they verify |
|----------|-------|-------|-----------------|
| Unit | tokens, chains, wallet, output | 20 | Token resolution, chain config, address utils, output formatting |
| Integration | api, rate, apy, info, balance, status, mint, redeem, claim, cli | 39 | Live API, all 10 vTokens, on-chain queries, validation, error codes |
| E2E | e2e | 6 | Full workflows, multi-token comparison, multi-chain, JSON consistency |

### Current Results

```
65 pass, 0 fail, 420 assertions
Ran 65 tests across 15 files
```

## Project Structure

```
skill_cli_new/
├── package.json
├── tsconfig.json
├── LICENSE
├── src/
│   ├── index.ts          # CLI entry point (#!/usr/bin/env node)
│   ├── commands/         # 8 command handlers
│   └── lib/
│       ├── tokens.ts     # 10 vToken configs + resolver
│       ├── chains.ts     # 4 EVM chain configs + resolver
│       ├── api.ts        # Bifrost API (all tokens)
│       ├── abi.ts        # vETH ERC-4626 ABI
│       ├── client.ts     # viem client factories
│       ├── wallet.ts     # Secure key handling
│       └── output.ts     # JSON + human output
├── dist/                 # Compiled JS (npm run build)
├── skills/
│   └── SKILL.md          # Agent skill file
└── test/                 # Unit, integration, e2e tests
```

## License

MIT
