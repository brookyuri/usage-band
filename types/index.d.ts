export type LastTurn = { input: number; output: number; cacheRead: number; cacheWrite: number; total: number }
export type Limits = { fiveHour: number | null; weekly: number | null; fiveHourResets?: string; weeklyResets?: string }

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { last: LastTurn | null; limits: Limits }
  }
}
