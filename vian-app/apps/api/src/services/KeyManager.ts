/**
 * KeyManager — Rate-limit aware OpenAI API key rotation.
 * Automatically switches to the next healthy key when a key hits its rate limit.
 * Never pauses generation. Never fails silently.
 */

interface KeyState {
  key: string
  isHealthy: boolean
  rateLimitedUntil: number | null  // timestamp when key becomes usable again
  requestCount: number              // total requests made
  errorCount: number                // consecutive errors
  lastUsed: number                  // timestamp of last use
}

export class KeyManager {
  private keys: KeyState[] = []
  private currentIndex: number = 0

  constructor() {
    const loadedKeys: string[] = []
    let i = 1
    // Load OPENAI_API_KEY_1, _2, _3 … _N
    while (process.env[`OPENAI_API_KEY_${i}`]) {
      loadedKeys.push(process.env[`OPENAI_API_KEY_${i}`]!)
      i++
    }
    // Fallback to single OPENAI_API_KEY
    if (loadedKeys.length === 0 && process.env.OPENAI_API_KEY) {
      loadedKeys.push(process.env.OPENAI_API_KEY)
    }
    if (loadedKeys.length === 0) {
      console.warn('[KeyManager] WARNING: No OpenAI API keys found. Generation will fail.')
    } else {
      this.keys = loadedKeys.map((key) => ({
        key,
        isHealthy: true,
        rateLimitedUntil: null,
        requestCount: 0,
        errorCount: 0,
        lastUsed: 0,
      }))
      console.log(`[KeyManager] Loaded ${this.keys.length} OpenAI key(s).`)
    }
  }

  getNextKey(): string {
    if (this.keys.length === 0) {
      throw new Error('No OpenAI API keys configured. Add OPENAI_API_KEY or OPENAI_API_KEY_1 to .env')
    }

    const now = Date.now()
    const total = this.keys.length

    for (let attempt = 0; attempt < total; attempt++) {
      const index = (this.currentIndex + attempt) % total
      const k = this.keys[index]

      // Skip still-rate-limited keys
      if (k.rateLimitedUntil && now < k.rateLimitedUntil) continue

      // Restore recovered keys
      if (k.rateLimitedUntil && now >= k.rateLimitedUntil) {
        k.isHealthy = true
        k.rateLimitedUntil = null
        k.errorCount = 0
        console.log('[KeyManager] Key recovered from rate limit.')
      }

      // Skip permanently broken keys (5+ consecutive errors)
      if (!k.isHealthy && k.errorCount >= 5) continue

      // Use this key
      this.currentIndex = (index + 1) % total
      k.lastUsed = now
      k.requestCount++
      return k.key
    }

    // All keys limited — find fastest recovery
    const soonest = this.keys
      .filter((k) => k.rateLimitedUntil !== null)
      .sort((a, b) => (a.rateLimitedUntil ?? 0) - (b.rateLimitedUntil ?? 0))[0]

    if (soonest) {
      const waitMs = (soonest.rateLimitedUntil ?? 0) - now
      throw new Error(`All OpenAI keys rate limited. Fastest recovery in ${Math.ceil(waitMs / 1000)}s.`)
    }

    throw new Error('No healthy OpenAI API keys available.')
  }

  markRateLimited(key: string, retryAfterSeconds = 60): void {
    const k = this.keys.find((k) => k.key === key)
    if (!k) return
    k.isHealthy = false
    k.rateLimitedUntil = Date.now() + retryAfterSeconds * 1000
    k.errorCount++
    console.warn(
      `[KeyManager] Key rate-limited for ${retryAfterSeconds}s. ${this.getHealthyCount()} key(s) remaining.`
    )
  }

  markError(key: string): void {
    const k = this.keys.find((k) => k.key === key)
    if (!k) return
    k.errorCount++
    if (k.errorCount >= 5) {
      k.isHealthy = false
      console.error('[KeyManager] Key permanently disabled after 5 consecutive errors.')
    }
  }

  markSuccess(key: string): void {
    const k = this.keys.find((k) => k.key === key)
    if (!k) return
    k.errorCount = 0
    k.isHealthy = true
  }

  getHealthyCount(): number {
    const now = Date.now()
    return this.keys.filter(
      (k) => k.isHealthy || (k.rateLimitedUntil !== null && now >= k.rateLimitedUntil)
    ).length
  }

  getStatus() {
    const now = Date.now()
    return this.keys.map((k, i) => ({
      key: `Key #${i + 1}`,
      status:
        k.rateLimitedUntil && now < k.rateLimitedUntil
          ? `rate_limited (${Math.ceil(((k.rateLimitedUntil ?? 0) - now) / 1000)}s remaining)`
          : k.isHealthy
          ? 'healthy'
          : 'error',
      totalRequests: k.requestCount,
      consecutiveErrors: k.errorCount,
    }))
  }
}

// Singleton — shared across the entire API server
export const keyManager = new KeyManager()
