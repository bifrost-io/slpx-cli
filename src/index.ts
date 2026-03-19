#!/usr/bin/env node
import { Command } from "commander";
import { rateCmd } from "./commands/rate.js";
import { balanceCmd } from "./commands/balance.js";
import { apyCmd } from "./commands/apy.js";
import { infoCmd } from "./commands/info.js";
import { statusCmd } from "./commands/status.js";
import { mintCmd } from "./commands/mint.js";
import { redeemCmd } from "./commands/redeem.js";
import { claimCmd } from "./commands/claim.js";

const program = new Command()
  .name("slpx")
  .description("Bifrost SLPx liquid staking CLI — all vTokens")
  .version("0.2.0");

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

program.parse();
