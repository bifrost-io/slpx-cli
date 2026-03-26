# @bifrostio/slpx-cli

Command-line tool for **Bifrost SLPx** liquid staking: exchange rates, APY (optional DeFiLlama LP pools), protocol stats, and **vETH** flows on EVM (balance, mint, redeem queue, claim).

- **Query commands** (`rate`, `apy`, `info`) work for all supported **vTokens** (vETH, vDOT, vKSM, …) via the Bifrost API.
- **On-chain commands** (`balance`, `status`, `mint`, `redeem`, `claim`) are **vETH-only** on **Ethereum, Base, Optimism, Arbitrum**.

## How to install

### Run directly

```bash
npx -y @bifrostio/slpx-cli
```

### Global install (optional)

```bash
npm i -g @bifrostio/slpx-cli
```

Then run:
```bash
slpx-cli
```
## Global options

| Option | Description | Default |
| ------ | ----------- | ------- |
| `--token <name>` | vToken: `vETH`, `vDOT`, `vKSM`, `vBNC`, `vGLMR`, `vMOVR`, `vFIL`, `vASTR`, `vMANTA`, `vPHA` | `vETH` |
| `--chain <name>` | EVM chain (on-chain / vETH only): `ethereum`, `base`, `optimism`, `arbitrum` | `ethereum` |
| `--rpc <url>` | Custom RPC URL | chain defaults |
| `--json` | Print JSON instead of human-readable text | off |

## Transaction-related options

| Option | Description |
| ------ | ----------- |
| `--dry-run` | Build unsigned transaction(s); do not broadcast |
| `--weth` | `mint`: use WETH instead of native ETH |
| `--lp` | `apy`: include LP pool yields (DeFiLlama) |
| `--address <addr>` | Address for dry-run / signing flows when no wallet env is configured |

## Commands

Use **`--json`** when you need stable, parseable output (e.g. scripts or CI).

### Query (all vTokens)

| Command | Purpose |
| ------- | ------- |
| `rate [amount]` | Base ↔ vToken exchange rate (default amount: 1 base unit) |
| `apy` | Staking APY (`baseApy`, `rewardApy`, `totalApy`); JSON includes `rewardApyIncentiveAsset`: **vDOT** for **vETH** only, **BNC** for all other vTokens; add `--lp` for LP pools |
| `info` | Protocol overview: rate, APY, TVL, holders; vETH adds contract, chains, paused |

```bash
npx -y @bifrostio/slpx-cli rate --json
npx -y @bifrostio/slpx-cli rate --token vDOT --json
npx -y @bifrostio/slpx-cli apy --token vDOT --lp --json
npx -y @bifrostio/slpx-cli info --json
```

### On-chain (vETH only)

| Command | Purpose |
| ------- | ------- |
| `balance [address]` | vETH balance and ETH value; omit address to use `BIFROST_SKILL_PRIVATEKEY`; comma-separated for batch |
| `status [address]` | Redemption queue: claimable / pending + time hint; omit address to use `BIFROST_SKILL_PRIVATEKEY` |
| `mint <amount>` | Stake ETH or WETH (`--weth`) → vETH |
| `redeem <amount>` | Start vETH redemption (**queued; not instant**, often ~1–3 days) |
| `claim` | Claim ETH after redemption completes |

```bash
npx -y @bifrostio/slpx-cli balance 0xYourAddress --chain base --json
npx -y @bifrostio/slpx-cli status --json
npx -y @bifrostio/slpx-cli status 0xYourAddress --json
npx -y @bifrostio/slpx-cli mint 0.1 --json --dry-run
npx -y @bifrostio/slpx-cli mint 0.1 --weth --json --dry-run
npx -y @bifrostio/slpx-cli redeem 1.0 --json --dry-run --address 0xYourAddress
npx -y @bifrostio/slpx-cli claim --json --dry-run --address 0xYourAddress
```

**vETH contract (all supported EVM chains):** `0xc3997ff81f2831929499c4eE4Ee4e0F08F42D4D8`

## Environment

| Variable | Purpose |
| -------- | ------- |
| `BIFROST_CHAIN` | Default chain if `--chain` is omitted |
| `BIFROST_RPC_URL` | Default RPC if `--rpc` is omitted |
| `BIFROST_SKILL_PRIVATEKEY` | Hex private key for **broadcast** txs; for `--dry-run`, either set this or pass `--address` (`mint` / `redeem` / `claim`) |

## JSON errors

With `--json`, failures are a single JSON object: `{ "error": true, "code": "...", "message": "..." }`.

Common codes: `INVALID_TOKEN`, `INVALID_CHAIN`, `INVALID_ADDRESS`, `INVALID_AMOUNT`, `UNSUPPORTED_TOKEN`, `CONTRACT_PAUSED`, `INSUFFICIENT_BALANCE`, `NOTHING_TO_CLAIM`, `NO_PRIVATE_KEY`, `NO_PRIVATE_KEY_OR_ADDRESS`, `NO_ADDRESS_OR_PRIVATE_KEY`, `RPC_ERROR`, `API_ERROR`, `TX_ERROR`, `CLI_ERROR`.

## Operational notes

1. **Substrate vTokens** (vDOT, vKSM, …): use **query** commands only; there is no EVM mint/redeem path in this CLI.
2. **Redeem** goes through Bifrost’s cross-chain queue — plan for delay before funds are claimable.
3. Prefer **`--dry-run`** before any real `mint` / `redeem` / `claim`.
4. With **`--weth`** and `--dry-run`, unsigned output includes approve + deposit steps.
5. The CLI may fall back to backup RPCs if the primary endpoint fails.

## Development

### Install dependencies

```bash
bun install
```

### Run tests

```bash
bun run test:all
```

### Build

```bash
bun run build
```

### Run dev

```bash
bun run dev
```

### Lint / format: 

`bun run lint` 

`bun run format`

`bun run check:biome`

## License

See `LICENSE`.
