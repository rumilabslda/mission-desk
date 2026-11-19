import fs from 'node:fs';

/** One activity-log line. Only these fields: never page text or typed text. */
export function logLine(e: { tool: string; account?: string; ok: boolean; error?: string }, now: number): string {
  return JSON.stringify({ t: new Date(now).toISOString(), tool: e.tool, account: e.account, ok: e.ok, error: e.error });
}

export function appendLog(file: string, line: string): void {
  try {
    fs.appendFileSync(file, `${line}\n`, { mode: 0o600 });
  } catch {
    // logging must never break a tool call
  }
}
