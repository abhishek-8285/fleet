import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet } from './api'

describe('api helpers', () => {
  const originalFetch = global.fetch
  beforeEach(() => {
    // @ts-ignore
    global.fetch = vi.fn()
  })
  afterEach(() => {
    global.fetch = originalFetch
    localStorage.clear()
  })

  it('GET returns JSON when ok', async () => {
    // @ts-ignore
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const res = await apiGet('/x')
    expect((res as any).ok).toBe(true)
  })
})


