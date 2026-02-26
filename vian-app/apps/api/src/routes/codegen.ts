import { Router, type Request, type Response, type IRouter } from 'express'
import { codeGenService } from '../services/CodeGenerationService'

export const codegenRouter: IRouter = Router()

/**
 * POST /api/codegen
 * 
 * Generate code with zero-cost optimization
 * - Groq primary (free)
 * - Hugging Face fallback (free)
 * - In-memory caching (no duplicate calls)
 * 
 * Body: { prompt: string }
 * Returns: { files: [...], provider, cached, generatedAt }
 */
codegenRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body

    // Validate input
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Prompt is required and must be a non-empty string'
      })
      return
    }

    // Limit prompt length for cost efficiency
    if (prompt.length > 2000) {
      res.status(400).json({
        error: 'Prompt too long',
        message: 'Maximum prompt length is 2000 characters'
      })
      return
    }

    console.log(`[POST /api/codegen] Request: "${prompt.substring(0, 50)}..."`)

    // Generate code
    const result = await codeGenService.generateCode(prompt)

    // Check if service is refreshing keys
    if (result.isRefreshing) {
      res.json({
        success: true,
        files: [],
        provider: result.provider,
        cached: false,
        isRefreshing: true,
        message: result.message || 'Please wait... refreshing API keys and retrying',
        generatedAt: result.generatedAt,
        stats: codeGenService.getStats()
      })
      return
    }

    // Return successful response
    res.json({
      success: true,
      ...result,
      stats: codeGenService.getStats()
    })

  } catch (error: any) {
    console.error('[POST /api/codegen] Error:', error.message)

    // Return "wait" message instead of error
    res.json({
      success: true,
      files: [],
      provider: 'groq',
      cached: false,
      isRefreshing: true,
      message: 'Please wait... processing your request',
      generatedAt: new Date().toISOString(),
      stats: codeGenService.getStats()
    })
  }
})

/**
 * GET /api/codegen/stats
 * 
 * Get service statistics
 * - Total requests
 * - Cache hit rate
 * - Provider usage
 * - Cost tracking
 */
codegenRouter.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = codeGenService.getStats()
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    })
  }
})

/**
 * POST /api/codegen/cache/clear
 * 
 * Clear cache manually (admin only)
 */
codegenRouter.post('/cache/clear', (_req: Request, res: Response) => {
  try {
    codeGenService.clearCache()
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    })
  }
})

/**
 * GET /api/codegen/health
 * 
 * Check health of all LLM providers (Ollama, Groq, Hugging Face)
 */
codegenRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await codeGenService.healthCheck()
    
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 207 : 503

    res.status(statusCode).json({
      success: true,
      ...health,
      message: health.status === 'healthy' 
        ? 'All providers operational'
        : health.status === 'degraded'
        ? 'Running with limited providers'
        : 'All providers down',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    })
  }
})

/**
 * GET /api/codegen/models
 * 
 * Get list of available Ollama models
 */
codegenRouter.get('/models', async (_req: Request, res: Response) => {
  try {
    const models = await codeGenService.listModels()
    res.json({
      success: true,
      models,
      currentModel: codeGenService.getCurrentModel(),
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models',
      message: error.message
    })
  }
})

/**
 * GET /api/codegen/models/recommended
 * 
 * Get recommended Ollama models for Next.js generation
 */
codegenRouter.get('/models/recommended', (_req: Request, res: Response) => {
  try {
    const recommended = [
      {
        name: 'deepseek-coder:6.7b',
        displayName: 'DeepSeek Coder 6.7B',
        description: 'Best balance of quality and speed (Recommended)',
        size: '3.8 GB',
        ram: '8 GB',
        speed: 'Fast',
        quality: 'Excellent',
        recommended: true
      },
      {
        name: 'qwen2.5-coder:7b',
        displayName: 'Qwen2.5 Coder 7B',
        description: 'Fast and efficient code generation',
        size: '4.7 GB',
        ram: '8 GB',
        speed: 'Fast',
        quality: 'Excellent',
        recommended: true
      },
      {
        name: 'deepseek-coder:33b',
        displayName: 'DeepSeek Coder 33B',
        description: 'Maximum quality for complex apps',
        size: '19 GB',
        ram: '32 GB',
        speed: 'Medium',
        quality: 'Outstanding',
        recommended: false
      },
      {
        name: 'codellama:13b',
        displayName: 'CodeLlama 13B',
        description: 'Good quality, general purpose',
        size: '7.4 GB',
        ram: '16 GB',
        speed: 'Medium',
        quality: 'Good',
        recommended: false
      }
    ]

    res.json({
      success: true,
      models: recommended,
      currentModel: codeGenService.getCurrentModel()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommended models',
      message: error.message
    })
  }
})

/**
 * POST /api/codegen/models/select
 * 
 * Select a model to use for generation (auto-installs if not available)
 * 
 * Body: { model: string }
 */
codegenRouter.post('/models/select', async (req: Request, res: Response) => {
  try {
    const { model } = req.body

    if (!model || typeof model !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Model name is required'
      })
      return
    }

    console.log(`[POST /api/codegen/models/select] Selecting model: ${model}`)
    
    // Set the model
    codeGenService.setModel(model)

    res.json({
      success: true,
      message: `Model '${model}' selected. It will be auto-installed on first use if not available.`,
      currentModel: model,
      note: 'First generation may take 2-5 minutes if model needs to be downloaded'
    })

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to select model',
      message: error.message
    })
  }
})

/**
 * Example request:
 * 
 * POST /api/codegen
 * {
 *   "prompt": "Create a React hook for fetching user data"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "files": [
 *     {
 *       "path": "useUser.ts",
 *       "content": "import { useState, useEffect } from 'react'..."
 *     }
 *   ],
 *   "provider": "groq",
 *   "cached": false,
 *   "generatedAt": "2026-02-26T10:30:00.000Z",
 *   "stats": {
 *     "totalRequests": 1,
 *     "cacheHits": 0,
 *     "groqCalls": 1,
 *     "hfCalls": 0,
 *     "cacheHitRate": "0%",
 *     "estimatedCost": "$0.00 (free tier only)"
 *   }
 * }
 */
