import { describe, test, expect } from "bun:test";
import { print } from "../src/lib/output";

describe("Output formatting", () => {
  test("JSON output is valid JSON", () => {
    const original = console.log;
    let output = "";
    console.log = (msg: string) => { output = msg; };

    print({ key: "value", num: 42 }, true);
    const parsed = JSON.parse(output);
    expect(parsed.key).toBe("value");
    expect(parsed.num).toBe(42);

    console.log = original;
  });

  test("human output contains key-value pairs", () => {
    const original = console.log;
    const lines: string[] = [];
    console.log = (msg: string) => { lines.push(msg); };

    print({ key: "value", num: 42 }, false);
    expect(lines.some(l => l.includes("key") && l.includes("value"))).toBe(true);
    expect(lines.some(l => l.includes("num") && l.includes("42"))).toBe(true);

    console.log = original;
  });

  test("nested objects are formatted", () => {
    const original = console.log;
    const lines: string[] = [];
    console.log = (msg: string) => { lines.push(msg); };

    print({ outer: { inner: "value" } }, false);
    expect(lines.some(l => l.includes("outer"))).toBe(true);
    expect(lines.some(l => l.includes("inner") && l.includes("value"))).toBe(true);

    console.log = original;
  });
});
