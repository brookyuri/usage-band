import { atom, read, update } from 'claude-code'
import type { Register, SessionRateLimit } from 'claude-code'

import type { LastTurn, Limits } from '../types'

const last = atom({ plugin: 'usage-band', key: 'last' } as const, null)
const limits = atom({ plugin: 'usage-band', key: 'limits' } as const, { fiveHour: null, weekly: null })

const RED = 80

function toLimits(rl: SessionRateLimit[]): Limits {
  const five = rl.find(r => r.kind === 'five_hour')
  const week = rl.find(r => r.kind === 'seven_day')
  return {
    fiveHour: five ? five.percentUsed : null,
    weekly: week ? week.percentUsed : null,
    fiveHourResets: five?.resetsAt,
    weeklyResets: week?.resetsAt,
  }
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function hhmm(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return ` ↻${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    try {
      const u = await $.session.usage()
      if (u.rateLimits.length) await update($, limits, () => toLimits(u.rateLimits))
    } catch {}
    return r
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (!e.agentId && e.usage) {
      const u = e.usage
      const t: LastTurn = {
        input: u.input_tokens,
        output: u.output_tokens,
        cacheRead: u.cache_read_input_tokens,
        cacheWrite: u.cache_creation_input_tokens,
        total: u.input_tokens + u.output_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens,
      }
      await update($, last, () => t)
    }
    return r
  })

  on('session.measure', async ($, e, next) => {
    if (e.rateLimits.length) await update($, limits, () => toLimits(e.rateLimits))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const t = await read($, last)
    const l = await read($, limits)
    const { Box, Text } = $.ui.resolve(e)

    const pct = (label: string, v: number | null, resets?: string) => {
      const hot = v !== null && v >= RED
      return (
        <Text color={hot ? 'red' : undefined} bold={hot} dimColor={!hot}>
          {label}: {v === null ? '—' : `${v}%`}{hot ? hhmm(resets) : ''}
        </Text>
      )
    }

    return (
      <Box flexDirection="row" gap={2}>
        <Text dimColor>
          {t
            ? `Промпт: ${fmt(t.total)} ток. (вх ${fmt(t.input)} · вых ${fmt(t.output)} · кэш ${fmt(t.cacheRead + t.cacheWrite)})`
            : 'Промпт: —'}
        </Text>
        {pct('5ч', l.fiveHour, l.fiveHourResets)}
        {pct('Неделя', l.weekly, l.weeklyResets)}
      </Box>
    )
  })
}
