#!/usr/bin/env node
import { Command, CommanderError } from "commander";
import { rateCmd } from "./commands/rate.js";
import { balanceCmd } from "./commands/balance.js";
import { apyCmd } from "./commands/apy.js";
import { infoCmd } from "./commands/info.js";
import { statusCmd } from "./commands/status.js";
import { mintCmd } from "./commands/mint.js";
import { redeemCmd } from "./commands/redeem.js";
import { claimCmd } from "./commands/claim.js";

const wantsJson = process.argv.includes("--json");

const program = new Command()
  .name("slpx")
  .description("Bifrost SLPx liquid staking CLI — all vTokens")
  .version("0.2.0");

if (wantsJson) {
  program.exitOverride();
  program.configureOutput({ writeErr: () => {}, writeOut: (s: string) => process.stdout.write(s) });
}

program
  .option("--chain <name>", "target EVM chain (ethereum|base|optimism|arbitrum)", "ethereum")
  .option("--token <name>", "vToken name (vETH|vDOT|vKSM|vBNC|vGLMR|vMOVR|vFIL|vASTR|vMANTA|vPHA)", "vETH")
  .option("--rpc <url>", "custom RPC endpoint")
  .option("--json", "output as JSON", false);

rateCmd(program);
balanceCmd(program);
apyCmd(program);
infoCmd(program);
statusCmd(program);
mintCmd(program);
redeemCmd(program);
claimCmd(program);

try {
  program.parse();
} catch (err: unknown) {
  if (wantsJson && err instanceof CommanderError) {
    const mapped = mapCommanderError(err.message);
    console.log(JSON.stringify({ error: true, code: mapped.code, message: mapped.message }, null, 2));
    process.exit(err.exitCode);
  }
  throw err;
}

function mapCommanderError(msg: string): { code: string; message: string } {
  if (msg.includes("missing required argument 'amount'")) {
    return { code: "INVALID_AMOUNT", message: "Amount is required." };
  }
  if (msg.includes("missing required argument 'address'")) {
    return { code: "INVALID_ADDRESS", message: "Address is required." };
  }
  if (/unknown option '(-?\d)/.test(msg)) {
    return { code: "INVALID_AMOUNT", message: "Amount must be a positive number. Negative values are not allowed." };
  }
  return { code: "CLI_ERROR", message: msg };
}
