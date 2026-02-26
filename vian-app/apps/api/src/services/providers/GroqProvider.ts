import Groq from 'groq-sdk'

/**
 * GroqProvider - Primary LLM provider (free tier)
 * Uses Llama 3.3 70B for code generation
 */
export class GroqProvider {
  private client: Groq
  private readonly model = 'llama-3.3-70b-versatile'
  private readonly maxTokens = 8000
  private readonly temperature = 0.1

  constructor() {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required')
    }
    this.client = new Groq({ apiKey })
  }

  /**
   * Generate code using Groq API
   * @param prompt - User's code generation request
   * @returns Generated code in JSON format
   */
  async callGroq(prompt: string): Promise<string> {
    try {
      console.log('[GroqProvider] Calling Groq API...')
      
      // Optimize prompt length (max 2000 chars for efficiency)
      const optimizedPrompt = this.optimizePrompt(prompt)

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: optimizedPrompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('Empty response from Groq')
      }

      console.log('[GroqProvider] Success ✓')
      return response

    } catch (error: any) {
      console.error('[GroqProvider] Error:', error.message)
      
      // Detect rate limit errors
      if (error?.status === 429 || error?.message?.includes('rate limit')) {
        throw new Error('RATE_LIMIT')
      }
      
      throw error
    }
  }

  /**
   * Optimize prompt to reduce token usage
   */
  private optimizePrompt(prompt: string): string {
    // Remove extra whitespace
    let optimized = prompt.trim().replace(/\s+/g, ' ')
    
    // Limit to 2000 chars for cost efficiency
    if (optimized.length > 2000) {
      optimized = optimized.substring(0, 2000) + '...'
    }

    return optimized
  }

  /**
   * System prompt for code generation
   */
  private getSystemPrompt(): string {
    return `You are an expert code generator. Generate clean, production-ready code.

RULES:
1. Return ONLY valid JSON in this exact format:
{
  "files": [
    { "path": "fileName.ext", "content": "complete file code here" }
  ]
}

2. Generate complete, working files
3. Use modern best practices
4. Include necessary imports
5. No explanations outside the JSON
6. Ensure valid JSON syntax

Example output:
{
  "files": [
    {
      "path": "app.ts",
      "content": "import express from 'express'\\n\\nconst app = express()\\napp.listen(3000)"
    }
  ]
}`
  }

  /**
   * Check if Groq service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 10
      })
      return true
    } catch {
      return false
    }
  }
}
