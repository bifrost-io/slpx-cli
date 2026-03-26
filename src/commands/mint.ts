import type { Command } from "commander";
import {
  type PublicClient,
  encodeFunctionData,
  formatEther,
  parseEther,
} from "viem";
import { erc20Abi, vethAbi } from "../lib/abi.js";
import {
  type ChainConfig,
  VETH_ADDRESS,
  explorerTxUrl,
} from "../lib/chains.js";
import { getPublicClient, getWalletClient } from "../lib/client.js";
import { evmTokenError, resolveChainOrError } from "../lib/evm-setup.js";
import { print, printError } from "../lib/output.js";
import { isPositiveAmount } from "../lib/validation.js";
import {
  readExpectedSharesFromDeposit,
  readVethPaused,
} from "../lib/veth-read.js";
import {
  type ResolvedSigner,
  formatAddress,
  resolveSigner,
} from "../lib/wallet.js";

export function mintCmd(program: Command) {
  program
    .command("mint <amount>")
    .description("Stake ETH/WETH to mint vETH (EVM only)")
    .option("--dry-run", "output unsigned tx without sending")
    .option("--weth", "use WETH instead of native ETH")
    .option(
      "--address <addr>",
      "receiver wallet (dry-run without environment variable BIFROST_SKILL_PRIVATEKEY)",
    )
    .action(
      async (
        amount: string,
        cmdOpts: { dryRun?: boolean; weth?: boolean; address?: string },
      ) => {
        const opts = program.opts();

        const tokenErr = evmTokenError(opts, "Mint");
        if (tokenErr) {
          return printError(tokenErr.code, tokenErr.message, opts.json);
        }

        if (!isPositiveAmount(amount)) {
          return printError(
            "INVALID_AMOUNT",
            "Amount must be a positive number.",
            opts.json,
          );
        }

        const chain = resolveChainOrError(opts);
        if ("code" in chain) {
          return printError(chain.code, chain.message, opts.json);
        }

        try {
          const client = getPublicClient(chain);
          const weiAmount = parseEther(amount);

          const paused = await readVethPaused(client);
          if (paused) {
            return printError(
              "CONTRACT_PAUSED",
              "vETH contract is paused. Try again later.",
              opts.json,
            );
          }

          const signer = resolveSigner({
            dryRun: cmdOpts.dryRun,
            address: cmdOpts.address,
          });
          if ("message" in signer) {
            return printError(signer.code, signer.message, opts.json);
          }

          const expectedVeth = await readExpectedSharesFromDeposit(
            client,
            weiAmount,
          );

          if (cmdOpts.weth) {
            return mintWithWeth(
              chain,
              client,
              weiAmount,
              expectedVeth,
              amount,
              opts,
              signer,
            );
          }

          if (signer.dryRun) {
            const data = encodeFunctionData({
              abi: vethAbi,
              functionName: "depositWithETH",
            });
            print(
              {
                action: "mint",
                inputAmount: amount,
                inputToken: "ETH",
                expectedAmount: formatEther(expectedVeth),
                expectedToken: "vETH",
                mode: "unsigned",
                from: formatAddress(signer.from),
                unsigned: {
                  to: VETH_ADDRESS,
                  value: weiAmount.toString(),
                  data,
                  chainId: chain.chainId,
                },
              },
              opts.json,
            );
            return;
          }

          const walletClient = getWalletClient(chain, signer.wallet);
          const txHash = await walletClient.writeContract({
            address: VETH_ADDRESS,
            abi: vethAbi,
            functionName: "depositWithETH",
            value: weiAmount,
          });

          print(
            {
              action: "mint",
              inputAmount: amount,
              inputToken: "ETH",
              expectedAmount: formatEther(expectedVeth),
              expectedToken: "vETH",
              from: formatAddress(signer.wallet.address),
              txHash,
              explorer: explorerTxUrl(chain, txHash),
            },
            opts.json,
          );
        } catch (e) {
          printError(
            "TX_ERROR",
            `Mint failed: ${(e as Error).message}`,
            opts.json,
          );
        }
      },
    );
}

async function mintWithWeth(
  chain: ChainConfig,
  client: PublicClient,
  weiAmount: bigint,
  expectedVeth: bigint,
  amount: string,
  opts: { json?: boolean },
  signer: ResolvedSigner,
) {
  const asJson = opts.json === true;
  const wethAddr = chain.weth as `0x${string}`;

  if (signer.dryRun) {
    const receiver = signer.from;
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [VETH_ADDRESS, weiAmount],
    });
    const depositData = encodeFunctionData({
      abi: vethAbi,
      functionName: "deposit",
      args: [weiAmount, receiver],
    });
    print(
      {
        action: "mint-weth",
        inputAmount: amount,
        inputToken: "WETH",
        expectedAmount: formatEther(expectedVeth),
        expectedToken: "vETH",
        mode: "unsigned",
        from: formatAddress(receiver),
        wethAddress: wethAddr,
        steps: [
          {
            step: 1,
            desc: "Approve WETH spending",
            to: wethAddr,
            data: approveData,
            chainId: chain.chainId,
          },
          {
            step: 2,
            desc: "Deposit WETH for vETH",
            to: VETH_ADDRESS,
            value: "0",
            data: depositData,
            chainId: chain.chainId,
          },
        ],
      },
      asJson,
    );
    return;
  }

  const walletClient = getWalletClient(chain, signer.wallet);
  const receiver = signer.wallet.address as `0x${string}`;

  const allowance = await client.readContract({
    address: wethAddr,
    abi: erc20Abi,
    functionName: "allowance",
    args: [receiver, VETH_ADDRESS],
  });

  if ((allowance as bigint) < weiAmount) {
    const approveTx = await walletClient.writeContract({
      address: wethAddr,
      abi: erc20Abi,
      functionName: "approve",
      args: [VETH_ADDRESS, weiAmount],
    });
    print(
      {
        action: "mint-weth-approve",
        desc: "WETH spending approved",
        txHash: approveTx,
        explorer: explorerTxUrl(chain, approveTx),
      },
      asJson,
    );
  }

  const txHash = await walletClient.writeContract({
    address: VETH_ADDRESS,
    abi: vethAbi,
    functionName: "deposit",
    args: [weiAmount, receiver],
  });

  print(
    {
      action: "mint-weth",
      inputAmount: amount,
      inputToken: "WETH",
      expectedAmount: formatEther(expectedVeth),
      expectedToken: "vETH",
      from: formatAddress(signer.wallet.address),
      txHash,
      explorer: explorerTxUrl(chain, txHash),
    },
    asJson,
  );
}
