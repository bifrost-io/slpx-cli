---
name: bifrost-slpx
description: |
  Bifrost SLPx liquid staking CLI — query exchange rates, APY, TVL, balances,
  redemption status; stake ETH to mint vETH, redeem vETH, claim redeemed ETH.
  Supports 10 vTokens: vETH, vDOT, vKSM, vBNC, vGLMR, vMOVR, vFIL, vASTR, vMANTA, vPHA.
  EVM on-chain operations (mint/redeem/claim/balance) are vETH-only on Ethereum, Base, Optimism, Arbitrum.
  Use when users ask about Bifrost, vToken, liquid staking, DeFi yields, or vToken operations.
keywords:
  - bifrost
  - vETH
  - vDOT
  - vToken
  - liquid-staking
  - DeFi
  - staking
  - mint
  - redeem
  - APY
metadata:
  author: bifrost.io
  version: "0.2.0"
---

# Bifrost SLPx CLI

CLI tool for Bifrost liquid staking. All on-chain interactions are handled internally — the agent only needs to run CLI commands and read structured output.

## Pre-flight Check

Before running any command, check if the CLI is available:

```bash
node ~/slpx-cli/dist/index.js --version
```

If the command fails, clone, install and build:

```bash
git clone https://github.com/bifrost-io/slpx-cli.git ~/slpx-cli && cd ~/slpx-cli && npm install && npm run build
```

Run commands with: `node ~/slpx-cli/dist/index.js <command> [args] [options]`

## Security Rules

> **MANDATORY — Do NOT skip these rules.**

1. **NEVER** read, cat, echo, print, or access `~/.bifrost/key` or any private key file.
2. **NEVER** ask the user for their private key in chat. If a wallet is needed, tell the user to set it up **themselves in a separate terminal**.
3. **NEVER** pass private keys as command arguments.
4. The CLI handles all signing internally. You only see the result (txHash, explorer link).

## Supported Tokens

| Token | Base Asset | Query (rate/apy/info) | On-chain (balance/mint/redeem/claim/status) |
|-------|-----------|----------------------|---------------------------------------------|
| vETH | ETH | Yes | Yes (Ethereum, Base, Optimism, Arbitrum) |
| vDOT | DOT | Yes | No (Substrate) |
| vKSM | KSM | Yes | No (Substrate) |
| vBNC | BNC | Yes | No (Substrate) |
| vGLMR | GLMR | Yes | No (Substrate) |
| vMOVR | MOVR | Yes | No (Substrate) |
| vFIL | FIL | Yes | No (Substrate) |
| vASTR | ASTR | Yes | No (Substrate) |
| vMANTA | MANTA | Yes | No (Substrate) |
| vPHA | PHA | Yes | No (Substrate) |

## Command Reference

### Query Commands (all vTokens)

#### `slpx rate [amount]`

Query exchange rate. Default: 1 unit of base asset.

```bash
node ~/slpx-cli/dist/index.js rate --json
node ~/slpx-cli/dist/index.js rate 10 --json
node ~/slpx-cli/dist/index.js rate --token vDOT --json
node ~/slpx-cli/dist/index.js rate 100 --token vKSM --json
```

Output fields: `input`, `output`, `rate`, `reverseRate`, `token`, `source`

#### `slpx apy`

Query staking APY (base + reward).

```bash
node ~/slpx-cli/dist/index.js apy --json
node ~/slpx-cli/dist/index.js apy --token vDOT --json
node ~/slpx-cli/dist/index.js apy --token vMANTA --json
```

Output fields: `token`, `totalApy`, `baseApy`, `rewardApy`

#### `slpx info`

Protocol overview: rate, APY, TVL, holders. For vETH also shows contract, chains, paused status.

```bash
node ~/slpx-cli/dist/index.js info --json
node ~/slpx-cli/dist/index.js info --token vDOT --json
node ~/slpx-cli/dist/index.js info --token vASTR --json
```

Output fields: `protocol`, `token`, `rate`, `totalApy`, `tvl`, `totalStaked`, `totalSupply`, `holders`
vETH extra: `contract`, `chains`, `paused`

### On-chain Commands (vETH only)

#### `slpx balance <address>`

Query vETH balance and ETH equivalent.

```bash
node ~/slpx-cli/dist/index.js balance 0x742d...bD18 --json
node ~/slpx-cli/dist/index.js balance 0x742d...bD18 --chain base --json
```

Output fields: `address`, `vethBalance`, `ethValue`, `chain`

#### `slpx status <address>`

Query redemption queue status.

```bash
node ~/slpx-cli/dist/index.js status 0x742d...bD18 --json
```

Output fields: `address`, `claimableEth`, `pendingAmount`, `chain`, `hint`

#### `slpx mint <amount>`

Stake ETH to receive vETH.

```bash
node ~/slpx-cli/dist/index.js mint 0.1 --json --dry-run
node ~/slpx-cli/dist/index.js mint 0.5 --chain base --json
```

Output fields (unsigned): `action`, `input`, `expected`, `mode`, `unsigned.to`, `unsigned.value`, `unsigned.data`, `unsigned.chainId`
Output fields (signed): `action`, `input`, `expected`, `from`, `txHash`, `explorer`

#### `slpx redeem <amount>`

Redeem vETH (NOT instant — enters processing queue).

```bash
node ~/slpx-cli/dist/index.js redeem 0.1 --json --dry-run --address 0x742d...
```

#### `slpx claim`

Claim completed ETH redemptions.

```bash
node ~/slpx-cli/dist/index.js claim --json --dry-run --address 0x742d...
```

### Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `--token <name>` | vToken: `vETH`, `vDOT`, `vKSM`, `vBNC`, `vGLMR`, `vMOVR`, `vFIL`, `vASTR`, `vMANTA`, `vPHA` | `vETH` |
| `--chain <name>` | EVM chain: `ethereum`, `base`, `optimism`, `arbitrum` (vETH only) | `ethereum` |
| `--rpc <url>` | Custom RPC endpoint | auto per chain |
| `--json` | Output as JSON (always use this) | false |

### Transaction Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Output unsigned tx without sending |
| `--address <addr>` | Specify wallet address (for redeem/claim without key file) |

## Workflows

### Compare All Token APYs

```bash
node ~/slpx-cli/dist/index.js apy --token vETH --json
node ~/slpx-cli/dist/index.js apy --token vDOT --json
node ~/slpx-cli/dist/index.js apy --token vKSM --json
```

### Research → Stake (vETH)

```bash
node ~/slpx-cli/dist/index.js info --json
node ~/slpx-cli/dist/index.js rate 1 --json
node ~/slpx-cli/dist/index.js apy --json
node ~/slpx-cli/dist/index.js mint 0.5 --json
```

### Redeem → Claim (vETH)

```bash
node ~/slpx-cli/dist/index.js balance 0x... --json
node ~/slpx-cli/dist/index.js redeem 1.0 --json
node ~/slpx-cli/dist/index.js status 0x... --json
node ~/slpx-cli/dist/index.js claim --json
```

## Error Handling

All errors return structured JSON with `error`, `code`, and `message` fields:

| Code | Meaning |
|------|---------|
| `INVALID_TOKEN` | Unknown vToken name |
| `UNSUPPORTED_TOKEN` | Token not available for on-chain operations |
| `INVALID_ADDRESS` | Bad Ethereum address format |
| `INVALID_AMOUNT` | Amount must be a positive number |
| `INVALID_CHAIN` | Unknown EVM chain name |
| `INSUFFICIENT_BALANCE` | Not enough vETH |
| `CONTRACT_PAUSED` | vETH contract is paused |
| `NOTHING_TO_CLAIM` | No completed redemptions to claim |
| `NO_WALLET` | No key file and no --address provided |
| `RPC_ERROR` | RPC connection failed |
| `API_ERROR` | Bifrost API unavailable |
| `TX_ERROR` | Transaction execution failed |

## Notes

1. Always use `--json` flag when calling from an agent for structured output.
2. Query commands (rate, apy, info) support all 10 vTokens via Bifrost API.
3. On-chain commands (balance, mint, redeem, claim, status) only support vETH on EVM chains.
4. Redemption is NOT instant — `redeem` enters a queue processed by Bifrost cross-chain mechanism.
5. vETH contract address is the same on all EVM chains: `0xc3997ff81f2831929499c4eE4Ee4e0F08F42D4D8`
