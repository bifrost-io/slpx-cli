/** Max length for user-visible error detail (avoids leaking long RPC revert blobs). */
const MAX_ERROR_MSG_LEN = 240;

/**
 * Strip control / injection-prone characters and cap length before writing errors to stderr/JSON.
 */
function stripControlAndDangerChars(message: string): string {
  let out = "";
  for (const c of message) {
    const code = c.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) {
      out += " ";
    } else if (!"<>&\"'".includes(c)) {
      out += c;
    }
  }
  return out;
}

export function sanitizeErrorMessage(message: string): string {
  let s = stripControlAndDangerChars(message);
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > MAX_ERROR_MSG_LEN) {
    s = `${s.slice(0, MAX_ERROR_MSG_LEN - 1)}…`;
  }
  return s;
}
