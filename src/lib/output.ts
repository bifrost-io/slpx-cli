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
  if (json) {
    console.log(JSON.stringify({ error: true, code, message }, null, 2));
  } else {
    console.error(`Error [${code}]: ${message}`);
  }
  process.exit(1);
}
