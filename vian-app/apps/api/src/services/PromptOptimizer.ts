/**
 * PromptOptimizer - Compress user prompts to minimize token usage
 * 
 * Strategies:
 * 1. Extract core keywords (remove filler words)
 * 2. Convert verbose descriptions to structured format
 * 3. Map to template IDs when possible
 * 4. Remove redundant phrases
 */

interface OptimizedPrompt {
  compressed: string
  original: string
  compressionRatio: number
  keywords: string[]
  suggestedTemplates: string[]
}

class PromptOptimizer {
  // Common filler words to remove
  private readonly FILLER_WORDS = new Set([
    'please', 'can', 'you', 'would', 'could', 'should', 'want', 'need', 'like',
    'make', 'create', 'build', 'implement', 'add', 'very', 'really', 'just',
    'the', 'a', 'an', 'and', 'or', 'but', 'with', 'for', 'to', 'of', 'in', 'on',
    'beautiful', 'nice', 'good', 'great', 'awesome', 'modern'
  ])

  // Feature keywords to preserve
  private readonly FEATURE_KEYWORDS = new Set([
    'auth', 'login', 'signup', 'register', 'logout', 'session',
    'dashboard', 'admin', 'panel', 'management',
    'crud', 'api', 'route', 'endpoint',
    'database', 'db', 'prisma', 'schema',
    'todo', 'task', 'list', 'item',
    'chat', 'message', 'conversation',
    'blog', 'post', 'article', 'comment',
    'user', 'profile', 'account',
    'upload', 'file', 'image', 'media',
    'search', 'filter', 'sort', 'pagination',
    'form', 'input', 'validation',
    'button', 'card', 'modal', 'navbar', 'footer',
    'responsive', 'mobile', 'dark mode', 'theme'
  ])

  /**
   * Extract meaningful keywords from user prompt
   */
  private extractKeywords(prompt: string): string[] {
    const words = prompt.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)

    const keywords: string[] = []

    // Extract feature keywords
    for (const word of words) {
      if (this.FEATURE_KEYWORDS.has(word) && !keywords.includes(word)) {
        keywords.push(word)
      }
    }

    // Extract multi-word features (e.g., "dark mode")
    const original = prompt.toLowerCase()
    for (const feature of this.FEATURE_KEYWORDS) {
      if (feature.includes(' ') && original.includes(feature) && !keywords.includes(feature)) {
        keywords.push(feature)
      }
    }

    return keywords
  }

  /**
   * Remove filler words and compress prompt
   */
  private compressText(prompt: string): string {
    const words = prompt.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => {
        return word.length > 0 && 
               !this.FILLER_WORDS.has(word) &&
               (word.length > 3 || this.FEATURE_KEYWORDS.has(word))
      })

    return words.join(' ')
  }

  /**
   * Map prompt to suggested templates
   */
  private suggestTemplates(keywords: string[]): string[] {
    const suggestions: string[] = []

    if (keywords.some(k => ['auth', 'login', 'signup', 'register'].includes(k))) {
      suggestions.push('auth-system')
    }
    if (keywords.some(k => ['dashboard', 'admin', 'panel'].includes(k))) {
      suggestions.push('dashboard-layout')
    }
    if (keywords.some(k => ['crud', 'api', 'route'].includes(k))) {
      suggestions.push('crud-pattern')
    }
    if (keywords.some(k => ['todo', 'task', 'list'].includes(k))) {
      suggestions.push('todo-app')
    }
    if (keywords.some(k => ['blog', 'post', 'article'].includes(k))) {
      suggestions.push('blog-system')
    }
    if (keywords.some(k => ['chat', 'message'].includes(k))) {
      suggestions.push('chat-app')
    }

    return suggestions
  }

  /**
   * Optimize a user prompt to minimize token usage
   */
  optimize(prompt: string): OptimizedPrompt {
    const keywords = this.extractKeywords(prompt)
    const compressed = this.compressText(prompt)
    const suggestedTemplates = this.suggestTemplates(keywords)

    // Build structured prompt
    let optimized = ''
    
    if (suggestedTemplates.length > 0) {
      optimized = `Build: ${keywords.join(', ')} (templates: ${suggestedTemplates.join(', ')})`
    } else {
      optimized = `Build: ${keywords.join(', ')}`
    }

    const compressionRatio = Math.round((1 - optimized.length / prompt.length) * 100)

    console.log(`[PromptOptimizer] Original: ${prompt.length} chars → Compressed: ${optimized.length} chars (${compressionRatio}% reduction)`)

    return {
      compressed: optimized,
      original: prompt,
      compressionRatio,
      keywords,
      suggestedTemplates
    }
  }

  /**
   * Check if prompt is already optimized (short and concise)
   */
  isOptimized(prompt: string): boolean {
    return prompt.length < 50 && !prompt.toLowerCase().includes('please')
  }
}

export const promptOptimizer = new PromptOptimizer()
