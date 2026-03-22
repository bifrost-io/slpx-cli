import type { Command } from "commander";
import { getPublicClient, getWalletClient } from "../lib/client.js";
import { resolveChain, VETH_ADDRESS } from "../lib/chains.js";
import { resolveToken } from "../lib/tokens.js";
import { vethAbi, erc20Abi } from "../lib/abi.js";
import { print, printError } from "../lib/output.js";
import { formatEther, parseEther, encodeFunctionData } from "viem";
import { loadWallet, formatAddress } from "../lib/wallet.js";

export function mintCmd(program: Command) {
  program
    .command("mint <amount>")
    .description("Stake ETH/WETH to mint vETH (EVM only)")
    .option("--dry-run", "output unsigned tx without sending")
    .option("--weth", "use WETH instead of native ETH")
    .action(async (amount: string, cmdOpts: { dryRun?: boolean; weth?: boolean }) => {
      const opts = program.opts();

      let token;
      try {
        token = resolveToken(opts.token);
      } catch (e) {
        return printError("INVALID_TOKEN", (e as Error).message, opts.json);
      }
      if (!token.evm) {
        return printError("UNSUPPORTED_TOKEN",
          `Mint only supports vETH (EVM). ${token.id} is on Substrate chains.`, opts.json);
      }

      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return printError("INVALID_AMOUNT", "Amount must be a positive number.", opts.json);
      }

      let chain;
      try {
        chain = resolveChain(opts);
      } catch (e) {
        return printError("INVALID_CHAIN", (e as Error).message, opts.json);
      }

      try {
        const client = getPublicClient(chain);
        const weiAmount = parseEther(amount);

        const paused = await client.readContract({
          address: VETH_ADDRESS, abi: vethAbi, functionName: "paused",
        });
        if (paused) {
          return printError("CONTRACT_PAUSED", "vETH contract is paused. Try again later.", opts.json);
        }

        let expectedVeth: bigint;
        try {
          expectedVeth = await client.readContract({
            address: VETH_ADDRESS, abi: vethAbi,
            functionName: "previewDeposit", args: [weiAmount],
          });
        } catch {
          expectedVeth = await client.readContract({
            address: VETH_ADDRESS, abi: vethAbi,
            functionName: "convertToShares", args: [weiAmount],
          });
        }

        if (cmdOpts.weth) {
          return mintWithWeth(chain, client, weiAmount, expectedVeth, amount, opts, cmdOpts);
        }

        const wallet = loadWallet();
        if (!wallet || cmdOpts.dryRun) {
          const data = encodeFunctionData({ abi: vethAbi, functionName: "depositWithETH" });
          print({
            action: "mint",
            input: `${amount} ETH`,
            expected: `${formatEther(expectedVeth)} vETH`,
            mode: "unsigned",
            unsigned: {
              to: VETH_ADDRESS,
              value: weiAmount.toString(),
              data,
              chainId: chain.chainId,
            },
          }, opts.json);
          return;
        }

        const walletClient = getWalletClient(chain, wallet);
        const txHash = await walletClient.writeContract({
          address: VETH_ADDRESS, abi: vethAbi,
          functionName: "depositWithETH",
          value: weiAmount,
        });

        print({
          action: "mint",
          input: `${amount} ETH`,
          expected: `${formatEther(expectedVeth)} vETH`,
          from: formatAddress(wallet.address),
          txHash,
          explorer: `${chain.explorer}/tx/${txHash}`,
        }, opts.json);
      } catch (e) {
        printError("TX_ERROR", `Mint failed: ${(e as Error).message}`, opts.json);
      }
    });
}

async function mintWithWeth(
  chain: ReturnType<typeof resolveChain>,
  client: any,
  weiAmount: bigint,
  expectedVeth: bigint,
  amount: string,
  opts: any,
  cmdOpts: { dryRun?: boolean },
) {
  const wallet = loadWallet();
  const wethAddr = chain.weth as `0x${string}`;

  if (!wallet || cmdOpts.dryRun) {
    const approveData = encodeFunctionData({
      abi: erc20Abi, functionName: "approve",
      args: [VETH_ADDRESS, weiAmount],
    });
    const depositData = encodeFunctionData({
      abi: vethAbi, functionName: "deposit",
      args: [weiAmount, "0x0000000000000000000000000000000000000000"],
    });
    print({
      action: "mint-weth",
      input: `${amount} WETH`,
      expected: `${formatEther(expectedVeth)} vETH`,
      mode: "unsigned",
      wethAddress: wethAddr,
      steps: [
        { step: 1, desc: "Approve WETH spending", to: wethAddr, data: approveData, chainId: chain.chainId },
        { step: 2, desc: "Deposit WETH for vETH", to: VETH_ADDRESS, value: "0", data: depositData, chainId: chain.chainId },
      ],
    }, opts.json);
    return;
  }

  const walletClient = getWalletClient(chain, wallet);
  const receiver = wallet.address as `0x${string}`;

  const allowance = await client.readContract({
    address: wethAddr, abi: erc20Abi,
    functionName: "allowance", args: [receiver, VETH_ADDRESS],
  });

  if ((allowance as bigint) < weiAmount) {
    const approveTx = await walletClient.writeContract({
      address: wethAddr, abi: erc20Abi,
      functionName: "approve", args: [VETH_ADDRESS, weiAmount],
    });
    print({
      action: "mint-weth-approve",
      desc: "WETH spending approved",
      txHash: approveTx,
      explorer: `${chain.explorer}/tx/${approveTx}`,
    }, opts.json);
  }

  const txHash = await walletClient.writeContract({
    address: VETH_ADDRESS, abi: vethAbi,
    functionName: "deposit", args: [weiAmount, receiver],
  });

  print({
    action: "mint-weth",
    input: `${amount} WETH`,
    expected: `${formatEther(expectedVeth)} vETH`,
    from: formatAddress(wallet.address),
    txHash,
    explorer: `${chain.explorer}/tx/${txHash}`,
  }, opts.json);
}
