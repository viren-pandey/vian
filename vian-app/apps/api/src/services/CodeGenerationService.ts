import { GroqProvider } from './providers/GroqProvider'
import { HuggingFaceProvider } from './providers/HuggingFaceProvider'
import { OllamaProvider } from './providers/OllamaProvider'
import crypto from 'crypto'

interface CacheEntry {
  result: string
  timestamp: number
  provider: 'groq' | 'huggingface' | 'ollama'
}

interface GenerationResult {
  files: Array<{
    path: string
    content: string
  }>
  provider: 'groq' | 'huggingface' | 'ollama'
  cached: boolean
  generatedAt: string
  isRefreshing?: boolean
  message?: string
}

/**
 * CodeGenerationService - Zero-cost AI code generator with intelligent fallback
 * 
 * Features:
 * - In-memory caching (no duplicate API calls)
 * - Multi-provider: Ollama (local) → Groq (free) → Hugging Face (free)
 * - Multi-key rotation (tries all keys before failing)
 * - Automatic provider switching on rate limits
 * - Returns "refreshing" status instead of errors
 */
export class CodeGenerationService {
  private groq: GroqProvider
  private huggingface: HuggingFaceProvider
  private ollama: OllamaProvider
  private cache: Map<string, CacheEntry>
  
  // Cache settings
  private readonly CACHE_TTL = 3600000 // 1 hour
  private readonly MAX_CACHE_SIZE = 200
  
  // Multi-key rotation
  private groqKeys: string[] = []
  private currentGroqKeyIndex = 0
  
  // Statistics
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    groqCalls: 0,
    hfCalls: 0,
    ollamaCalls: 0,
    errors: 0,
    keyRotations: 0
  }

  constructor() {
    // Load all Groq keys FIRST (before creating provider)
    this.loadGroqKeys()
    
    // Set first key as default for initial GroqProvider instance
    if (this.groqKeys.length > 0) {
      process.env.GROQ_API_KEY = this.groqKeys[0]
    }
    
    this.groq = new GroqProvider()
    this.huggingface = new HuggingFaceProvider()
    this.ollama = new OllamaProvider()
    this.cache = new Map()
    
    console.log('[CodeGenerationService] Initialized with Ollama + Groq + HuggingFace')
    console.log(`[CodeGenerationService] Groq keys loaded: ${this.groqKeys.length}`)
  }

  /**
   * Load all Groq API keys from environment
   */
  private loadGroqKeys(): void {
    const keys: string[] = []
    
    // Load numbered keys (GROQ_API_KEY_1, GROQ_API_KEY_2, etc.)
    for (let i = 1; i <= 20; i++) {
      const key = process.env[`GROQ_API_KEY_${i}`]
      if (key && key.trim()) {
        keys.push(key.trim())
      }
    }
    
    // Also check for single GROQ_API_KEY
    const singleKey = process.env.GROQ_API_KEY
    if (singleKey && singleKey.trim() && !keys.includes(singleKey.trim())) {
      keys.push(singleKey.trim())
    }
    
    this.groqKeys = keys
  }

  /**
   * Main code generation function with caching and multi-provider fallback
   * @param prompt - User's code generation request
   * @returns Generated code in structured format
   */
  async generateCode(prompt: string): Promise<GenerationResult> {
    this.stats.totalRequests++
    
    try {
      // 1. Check cache first (zero API calls)
      const cacheKey = this.getCacheKey(prompt)
      const cached = this.getFromCache(cacheKey)
      
      if (cached) {
        console.log('[CodeGenerationService] Cache HIT ✓ (0 API calls)')
        this.stats.cacheHits++
        
        const parsed = JSON.parse(cached.result)
        return {
          ...parsed,
          provider: cached.provider,
          cached: true,
          generatedAt: new Date(cached.timestamp).toISOString()
        }
      }

      console.log('[CodeGenerationService] Cache MISS - trying providers...')

      // 2. Try Ollama first (100% free, local, no limits)
      try {
        console.log('[CodeGenerationService] Trying Ollama (local)...')
        const result = await this.ollama.callOllama(prompt)
        this.stats.ollamaCalls++
        
        const parsed = this.validateResponse(result)
        this.saveToCache(cacheKey, result, 'ollama')
        
        console.log('[CodeGenerationService] ✓ Success via Ollama (local)')
        return {
          ...parsed,
          provider: 'ollama',
          cached: false,
          generatedAt: new Date().toISOString()
        }
      } catch (ollamaError: any) {
        console.log('[CodeGenerationService] Ollama not available, trying cloud providers...')
      }

      // 3. Try Groq with key rotation (free tier, multiple keys)
      if (this.groqKeys.length > 0) {
        const groqResult = await this.tryGroqWithRotation(prompt)
        if (groqResult) {
          const parsed = this.validateResponse(groqResult)
          this.saveToCache(cacheKey, groqResult, 'groq')
          
          console.log('[CodeGenerationService] ✓ Success via Groq')
          return {
            ...parsed,
            provider: 'groq',
            cached: false,
            generatedAt: new Date().toISOString()
          }
        }
      }

      // 4. Fallback to Hugging Face (free inference API)
      try {
        console.log('[CodeGenerationService] Trying Hugging Face...')
        const result = await this.huggingface.callHuggingFace(prompt)
        this.stats.hfCalls++
        
        const parsed = this.validateResponse(result)
        this.saveToCache(cacheKey, result, 'huggingface')
        
        console.log('[CodeGenerationService] ✓ Success via Hugging Face')
        return {
          ...parsed,
          provider: 'huggingface',
          cached: false,
          generatedAt: new Date().toISOString()
        }
      } catch (hfError: any) {
        // All providers exhausted - return refreshing status
        console.log('[CodeGenerationService] All providers rate-limited, refreshing...')
        
        return {
          files: [],
          provider: 'groq',
          cached: false,
          generatedAt: new Date().toISOString(),
          isRefreshing: true,
          message: 'Please wait... refreshing API keys and retrying'
        }
      }

    } catch (error: any) {
      this.stats.errors++
      console.error('[CodeGenerationService] Error:', error.message)
      
      // Return refreshing status instead of error
      return {
        files: [],
        provider: 'groq',
        cached: false,
        generatedAt: new Date().toISOString(),
        isRefreshing: true,
        message: 'Please wait... processing your request'
      }
    }
  }

  /**
   * Try Groq with automatic key rotation
   */
  private async tryGroqWithRotation(prompt: string): Promise<string | null> {
    const maxAttempts = this.groqKeys.length
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const currentKey = this.groqKeys[this.currentGroqKeyIndex]
        
        // Temporarily set the key for this attempt
        process.env.GROQ_API_KEY = currentKey
        
        console.log(`[CodeGenerationService] Trying Groq key ${this.currentGroqKeyIndex + 1}/${this.groqKeys.length}...`)
        
        // Create new provider instance with current key
        const groqProvider = new GroqProvider()
        const result = await groqProvider.callGroq(prompt)
        
        this.stats.groqCalls++
        console.log(`[CodeGenerationService] ✓ Groq key ${this.currentGroqKeyIndex + 1} succeeded`)
        
        // ROTATE TO NEXT KEY AFTER SUCCESS (load balancing)
        this.currentGroqKeyIndex = (this.currentGroqKeyIndex + 1) % this.groqKeys.length
        
        return result
        
      } catch (error: any) {
        console.log(`[CodeGenerationService] Groq key ${this.currentGroqKeyIndex + 1} failed: ${error.message}`)
        
        // Rotate to next key on failure
        this.currentGroqKeyIndex = (this.currentGroqKeyIndex + 1) % this.groqKeys.length
        this.stats.keyRotations++
        
        // If rate limited, try next key immediately
        if (error.message.includes('RATE_LIMIT') || error.message.includes('429')) {
          continue
        }
        
        // For other errors, also try next key
        continue
      }
    }
    
    console.log('[CodeGenerationService] All Groq keys exhausted')
    return null
  }

  /**
   * Generate cache key from prompt
   */
  private getCacheKey(prompt: string): string {
    const normalized = prompt.trim().toLowerCase().replace(/\s+/g, ' ')
    return crypto.createHash('sha256').update(normalized).digest('hex')
  }

  /**
   * Get from cache if exists and not expired
   */
  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    const age = Date.now() - entry.timestamp
    if (age > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }
    
    return entry
  }

  /**
   * Save to cache with LRU eviction
   */
  private saveToCache(key: string, result: string, provider: 'groq' | 'huggingface' | 'ollama'): void {
    // LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      provider
    })

    console.log(`[CodeGenerationService] Cached result (size: ${this.cache.size}/${this.MAX_CACHE_SIZE})`)
  }

  /**
   * Validate response format
   */
  private validateResponse(response: string): { files: Array<{ path: string; content: string }> } {
    try {
      const parsed = JSON.parse(response)
      
      if (!parsed.files || !Array.isArray(parsed.files)) {
        throw new Error('Invalid response format: missing files array')
      }

      for (const file of parsed.files) {
        if (!file.path || !file.content) {
          throw new Error('Invalid file format: missing path or content')
        }
      }

      return parsed
      
    } catch (error: any) {
      throw new Error(`Response validation failed: ${error.message}`)
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      cacheHitRate: this.stats.totalRequests > 0 
        ? `${((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(1)}%`
        : '0%',
      ollamaUsage: `${this.stats.ollamaCalls} calls (local)`,
      groqUsage: `${this.stats.groqCalls} calls (free)`,
      hfUsage: `${this.stats.hfCalls} calls (free)`,
      totalApiCalls: this.stats.groqCalls + this.stats.hfCalls + this.stats.ollamaCalls,
      keyRotations: this.stats.keyRotations,
      availableGroqKeys: this.groqKeys.length,
      currentGroqKey: this.currentGroqKeyIndex + 1,
      estimatedCost: '$0.00 (free tier only)'
    }
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.cache.clear()
    console.log('[CodeGenerationService] Cache cleared')
  }

  /**
   * Health check for all providers
   */
  async healthCheck(): Promise<{
    ollama: { available: boolean; model?: string; url?: string }
    groq: { available: boolean; keys?: number }
    huggingface: { available: boolean }
    status: 'healthy' | 'degraded' | 'down'
  }> {
    const [ollamaHealthy, groqHealthy, hfHealthy] = await Promise.all([
      this.ollama.healthCheck(),
      this.groq.healthCheck(),
      this.huggingface.healthCheck()
    ])

    let status: 'healthy' | 'degraded' | 'down'
    if (ollamaHealthy || (groqHealthy && hfHealthy)) {
      status = 'healthy'
    } else if (groqHealthy || hfHealthy) {
      status = 'degraded'
    } else {
      status = 'down'
    }

    return { 
      ollama: { 
        available: ollamaHealthy,
        model: process.env.OLLAMA_MODEL || 'deepseek-coder:6.7b',
        url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
      },
      groq: { 
        available: groqHealthy,
        keys: this.groqKeys.length
      },
      huggingface: { 
        available: hfHealthy 
      },
      status 
    }
  }

  /**
   * List available Ollama models
   */
  async listModels(): Promise<string[]> {
    try {
      return await this.ollama.listModels()
    } catch (error) {
      console.error('[CodeGenerationService] Failed to list models:', error)
      return []
    }
  }

  /**
   * Set the Ollama model to use for generation
   */
  setModel(modelName: string): void {
    this.ollama.setModel(modelName)
    console.log(`[CodeGenerationService] Model set to: ${modelName}`)
  }

  /**
   * Get current Ollama model name
   */
  getCurrentModel(): string {
    return this.ollama.getModel()
  }
}

// Export singleton instance
export const codeGenService = new CodeGenerationService()
