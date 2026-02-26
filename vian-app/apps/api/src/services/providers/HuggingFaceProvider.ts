/**
 * HuggingFaceProvider - Fallback LLM provider (free inference API)
 * Uses Qwen2.5-Coder-7B-Instruct for code generation
 */
export class HuggingFaceProvider {
  private readonly apiKey: string
  private readonly model = 'Qwen/Qwen2.5-Coder-7B-Instruct'
  private readonly apiUrl = 'https://api-inference.huggingface.co/models/'
  private readonly maxTokens = 4096
  private readonly temperature = 0.1

  constructor() {
    const apiKey = process.env.HUGGINGFACE_API_KEY
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY environment variable is required')
    }
    this.apiKey = apiKey
  }

  /**
   * Generate code using Hugging Face Inference API
   * @param prompt - User's code generation request
   * @returns Generated code in JSON format
   */
  async callHuggingFace(prompt: string): Promise<string> {
    try {
      console.log('[HuggingFaceProvider] Calling Hugging Face API (fallback)...')
      
      const optimizedPrompt = this.optimizePrompt(prompt)
      const fullPrompt = this.buildPrompt(optimizedPrompt)

      const response = await fetch(`${this.apiUrl}${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: this.maxTokens,
            temperature: this.temperature,
            return_full_text: false,
            do_sample: false
          },
          options: {
            wait_for_model: true,
            use_cache: true
          }
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`HuggingFace API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      
      // Extract generated text
      let generated = ''
      if (Array.isArray(data) && data[0]?.generated_text) {
        generated = data[0].generated_text
      } else if (typeof data === 'object' && data.generated_text) {
        generated = data.generated_text
      } else {
        throw new Error('Unexpected response format from Hugging Face')
      }

      // Extract JSON from response
      const jsonMatch = generated.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        // Fallback: create JSON structure from raw code
        return this.wrapInJSON(generated, prompt)
      }

      const cleanJson = jsonMatch[0]
      
      // Validate JSON
      JSON.parse(cleanJson)
      
      console.log('[HuggingFaceProvider] Success ✓')
      return cleanJson

    } catch (error: any) {
      console.error('[HuggingFaceProvider] Error:', error.message)
      throw error
    }
  }

  /**
   * Optimize prompt for token efficiency
   */
  private optimizePrompt(prompt: string): string {
    let optimized = prompt.trim().replace(/\s+/g, ' ')
    
    // Limit to 1500 chars for HF free tier
    if (optimized.length > 1500) {
      optimized = optimized.substring(0, 1500) + '...'
    }

    return optimized
  }

  /**
   * Build complete prompt with system instructions
   */
  private buildPrompt(userPrompt: string): string {
    return `Generate production-ready code for: ${userPrompt}

Return ONLY valid JSON in this format:
{
  "files": [
    { "path": "fileName.ext", "content": "complete code here" }
  ]
}

Important:
- Generate complete, working files
- Use modern best practices
- Include all necessary imports
- Return ONLY the JSON object
- No markdown, no explanations

JSON output:`
  }

  /**
   * Wrap raw code output in JSON structure
   */
  private wrapInJSON(code: string, prompt: string): string {
    // Clean the code
    const cleanCode = code
      .replace(/^```[\w]*\n?/gm, '')
      .replace(/\n?```$/gm, '')
      .trim()

    // Determine file extension from prompt
    let ext = 'js'
    if (prompt.toLowerCase().includes('typescript') || prompt.toLowerCase().includes('.ts')) {
      ext = 'ts'
    } else if (prompt.toLowerCase().includes('python')) {
      ext = 'py'
    } else if (prompt.toLowerCase().includes('react')) {
      ext = 'tsx'
    }

    // Determine filename
    const filename = `generated.${ext}`

    // Escape code for JSON
    const escapedCode = cleanCode
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')

    return JSON.stringify({
      files: [
        {
          path: filename,
          content: cleanCode
        }
      ]
    })
  }

  /**
   * Check if Hugging Face service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: 'test',
          parameters: { max_new_tokens: 10 }
        })
      })
      return response.ok || response.status === 503 // 503 = model loading
    } catch {
      return false
    }
  }
}
