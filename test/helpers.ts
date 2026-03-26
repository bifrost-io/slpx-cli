import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function runCli(
  args: string,
  envOverrides?: Record<string, string | undefined>,
): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(
      "node",
      ["dist/index.js", ...args.split(/\s+/).filter(Boolean)],
      {
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          BIFROST_CHAIN: undefined,
          BIFROST_RPC_URL: undefined,
          BIFROST_SKILL_PRIVATEKEY: undefined,
          ...envOverrides,
        },
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
    });

    child.on("close", (code: number | null) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code ?? 1,
      });
    });
  });
}

export async function runJson(
  args: string,
  envOverrides?: Record<string, string | undefined>,
): Promise<unknown> {
  const result = await runCli(`${args} --json`, envOverrides);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `Failed to parse JSON from: ${result.stdout}\nstderr: ${result.stderr}`,
    );
  }
}
