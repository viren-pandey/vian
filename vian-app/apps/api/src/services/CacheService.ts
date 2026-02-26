// Response caching service to minimize API calls
import { createHash } from 'crypto'

interface CacheEntry {
  response: string
  timestamp: number
  hits: number
}

class CacheService {
  private cache = new Map<string, CacheEntry>()
  private readonly MAX_CACHE_SIZE = 500
  private readonly CACHE_TTL = 3600000 // 1 hour

  // Generate cache key from prompt
  private getCacheKey(prompt: string, model: string): string {
    const normalized = prompt.toLowerCase().trim()
    return createHash('sha256').update(`${model}:${normalized}`).digest('hex')
  }

  // Check if prompt is similar to cached one
  private findSimilar(prompt: string, model: string): string | null {
    const words = prompt.toLowerCase().split(/\s+/)
    const keyWords = words.filter(w => w.length > 3)

    for (const [key, entry] of this.cache.entries()) {
      if (!key.startsWith(model)) continue
      
      const cachedPrompt = entry.response.substring(0, 200).toLowerCase()
      const matches = keyWords.filter(w => cachedPrompt.includes(w)).length
      
      if (matches / keyWords.length > 0.7) { // 70% similarity
        return key
      }
    }
    return null
  }

  get(prompt: string, model: string): string | null {
    const key = this.getCacheKey(prompt, model)
    const entry = this.cache.get(key)

    if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
      entry.hits++
      console.log(`[Cache] HIT (${entry.hits} hits)`)
      return entry.response
    }

    // Try similar match
    const similarKey = this.findSimilar(prompt, model)
    if (similarKey) {
      const similar = this.cache.get(similarKey)
      if (similar && Date.now() - similar.timestamp < this.CACHE_TTL) {
        similar.hits++
        console.log(`[Cache] SIMILAR HIT (${similar.hits} hits)`)
        return similar.response
      }
    }

    console.log('[Cache] MISS')
    return null
  }

  set(prompt: string, model: string, response: string): void {
    const key = this.getCacheKey(prompt, model)

    // Evict oldest if cache full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
      this.cache.delete(oldest[0])
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      hits: 0,
    })
  }

  clear(): void {
    this.cache.clear()
  }

  stats() {
    const entries = Array.from(this.cache.values())
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, e) => sum + e.hits, 0),
      avgAge: entries.length > 0 
        ? (Date.now() - entries.reduce((sum, e) => sum + e.timestamp, 0) / entries.length) / 1000
        : 0,
    }
  }
}

export const cacheService = new CacheService()
