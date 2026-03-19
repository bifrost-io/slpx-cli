import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function runCli(args: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn("node", ["dist/index.js", ...args.split(/\s+/).filter(Boolean)], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, BIFROST_CHAIN: undefined, BIFROST_RPC_URL: undefined },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));

    child.on("close", (code: number | null) => {
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code ?? 1 });
    });
  });
}

export async function runJson(args: string): Promise<any> {
  const result = await runCli(`${args} --json`);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`Failed to parse JSON from: ${result.stdout}\nstderr: ${result.stderr}`);
  }
}
