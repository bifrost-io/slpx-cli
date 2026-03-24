import { sanitizeErrorMessage } from "./sanitize.js";

export function print(data: Record<string, unknown>, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    printHuman(data, "");
  }
}

function printHuman(obj: Record<string, unknown>, prefix: string): void {
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      console.log(`${prefix}${key}:`);
      printHuman(value as Record<string, unknown>, `${prefix}  `);
    } else {
      console.log(`${prefix}${key}: ${value}`);
    }
  }
}

export function printError(code: string, message: string, json: boolean): void {
  const safe = sanitizeErrorMessage(message);
  if (json) {
    console.log(JSON.stringify({ error: true, code, message: safe }, null, 2));
  } else {
    console.error(`Error [${code}]: ${safe}`);
  }
  process.exit(1);
}
