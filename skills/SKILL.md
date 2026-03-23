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
npx -y @bifrost-io/slpx-cli --version
```

If the above fails (package not yet published), install manually:

```bash
git clone https://github.com/bifrost-io/slpx-cli.git ~/slpx-cli && cd ~/slpx-cli && npm install && npm run build
```

Then use `node ~/slpx-cli/dist/index.js` instead of `npx -y @bifrost-io/slpx-cli` in all commands below.

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
npx -y @bifrost-io/slpx-cli rate --json
npx -y @bifrost-io/slpx-cli rate 10 --json
npx -y @bifrost-io/slpx-cli rate --token vDOT --json
npx -y @bifrost-io/slpx-cli rate 100 --token vKSM --json
```

Output fields: `input`, `output`, `rate`, `reverseRate`, `token`, `source`

#### `slpx apy`

Query staking APY (base + reward). Add `--lp` to also show LP pool yields from DeFiLlama.

```bash
npx -y @bifrost-io/slpx-cli apy --json
npx -y @bifrost-io/slpx-cli apy --token vDOT --json
npx -y @bifrost-io/slpx-cli apy --token vMANTA --json
npx -y @bifrost-io/slpx-cli apy --token vDOT --lp --json
```

Output fields: `token`, `totalApy`, `baseApy`, `rewardApy`
- `baseApy` = native staking yield from the underlying chain (e.g. Ethereum PoS rewards)
- `rewardApy` = additional incentive from Bifrost BNC token farming
- `totalApy` = baseApy + rewardApy

With `--lp`: adds `lpPools` array — each entry has `symbol`, `project`, `chain`, `lpApy`, `tvl`

#### `slpx info`

Protocol overview: rate, APY, TVL, holders. For vETH also shows contract, chains, paused status.

```bash
npx -y @bifrost-io/slpx-cli info --json
npx -y @bifrost-io/slpx-cli info --token vDOT --json
npx -y @bifrost-io/slpx-cli info --token vASTR --json
```

Output fields: `protocol`, `token`, `rate`, `totalApy`, `tvl`, `totalStaked`, `totalSupply`, `holders`
vETH extra: `contract`, `chains`, `paused`

### On-chain Commands (vETH only)

#### `slpx balance <address>`

Query vETH balance and ETH equivalent. Supports comma-separated addresses for batch query.

```bash
npx -y @bifrost-io/slpx-cli balance 0x742d...bD18 --json
npx -y @bifrost-io/slpx-cli balance 0x742d...bD18 --chain base --json
npx -y @bifrost-io/slpx-cli balance 0xAddr1,0xAddr2,0xAddr3 --json
```

Single output fields: `address`, `vethBalance`, `ethValue`, `chain`
Batch output fields: `results` (array of `{address, vethBalance, ethValue}`), `chain`

#### `slpx status <address>`

Query redemption queue status.

```bash
npx -y @bifrost-io/slpx-cli status 0x742d...bD18 --json
```

Output fields: `address`, `claimableEth`, `pendingAmount`, `chain`, `hint` (includes time estimate when pending)

#### `slpx mint <amount>`

Stake ETH to receive vETH. Add `--weth` to deposit WETH instead of native ETH.

```bash
npx -y @bifrost-io/slpx-cli mint 0.1 --json --dry-run
npx -y @bifrost-io/slpx-cli mint 0.5 --chain base --json
npx -y @bifrost-io/slpx-cli mint 0.1 --weth --json --dry-run
npx -y @bifrost-io/slpx-cli mint 0.5 --weth --chain arbitrum --json
```

Native ETH output (unsigned): `action`, `input`, `expected`, `mode`, `unsigned.to`, `unsigned.value`, `unsigned.data`, `unsigned.chainId`
WETH output (unsigned): `action:mint-weth`, `input`, `expected`, `mode`, `wethAddress`, `steps` (array: step 1 Approve, step 2 Deposit)
Output (signed): `action`, `input`, `expected`, `from`, `txHash`, `explorer`

WETH addresses per chain: Ethereum `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`, Arbitrum `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1`, Base/Optimism `0x4200000000000000000000000000000000000006`

#### `slpx redeem <amount>`

Redeem vETH (NOT instant — enters processing queue, typically 1-3 days).

> **IMPORTANT**: Before executing a redeem, ALWAYS confirm with the user: show the amount, explain that redemption is NOT instant (enters a processing queue), and ask for explicit confirmation. Use `--dry-run` first to preview.

```bash
npx -y @bifrost-io/slpx-cli redeem 0.1 --json --dry-run --address 0x742d...
```

#### `slpx claim`

Claim completed ETH redemptions.

```bash
npx -y @bifrost-io/slpx-cli claim --json --dry-run --address 0x742d...
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
| `--weth` | Use WETH instead of native ETH (mint only) |
| `--lp` | Show LP pool yields from DeFiLlama (apy only) |
| `--address <addr>` | Specify wallet address (for redeem/claim without key file) |

## Workflows

### Compare Token APYs with LP Pools

```bash
npx -y @bifrost-io/slpx-cli apy --token vDOT --lp --json
npx -y @bifrost-io/slpx-cli apy --token vETH --lp --json
npx -y @bifrost-io/slpx-cli apy --token vKSM --json
```

### Batch Balance Check

```bash
npx -y @bifrost-io/slpx-cli balance 0xAddr1,0xAddr2,0xAddr3 --json
```

### Research → Stake (vETH)

```bash
npx -y @bifrost-io/slpx-cli info --json
npx -y @bifrost-io/slpx-cli rate 1 --json
npx -y @bifrost-io/slpx-cli apy --json
npx -y @bifrost-io/slpx-cli mint 0.5 --json
```

### Redeem → Claim (vETH)

```bash
npx -y @bifrost-io/slpx-cli balance 0x... --json
npx -y @bifrost-io/slpx-cli redeem 1.0 --json
npx -y @bifrost-io/slpx-cli status 0x... --json
npx -y @bifrost-io/slpx-cli claim --json
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
| `API_ERROR` | Bifrost API unavailable or timed out |
| `TX_ERROR` | Transaction execution failed |
| `CLI_ERROR` | Missing argument or invalid option |

## Notes

1. Always use `--json` flag when calling from an agent for structured output. Without `--json`, output is human-readable text.
2. Query commands (rate, apy, info) support all 10 vTokens via Bifrost API.
3. On-chain commands (balance, mint, redeem, claim, status) only support vETH on EVM chains.
4. Redemption is NOT instant — `redeem` enters a queue processed by Bifrost cross-chain mechanism.
5. vETH contract address is the same on all EVM chains: `0xc3997ff81f2831929499c4eE4Ee4e0F08F42D4D8`
6. RPC endpoints have automatic fallback — if the primary RPC fails, the CLI switches to a backup RPC automatically.
7. `--weth` mints vETH from WETH (ERC-20) instead of native ETH. In unsigned mode, outputs two steps: Approve + Deposit.
8. `--lp` flag on `apy` fetches LP pool data from DeFiLlama for the selected vToken (top pools by TVL).
9. Balance command accepts comma-separated addresses for batch query: `balance addr1,addr2,addr3`
