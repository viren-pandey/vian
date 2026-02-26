/**
 * Test script for Ollama-powered Next.js app generation
 * 
 * Prerequisites:
 * 1. Install Ollama: https://ollama.ai
 * 2. Pull a code model: ollama pull deepseek-coder:6.7b
 *    OR: ollama pull qwen2.5-coder:7b
 * 3. Start Ollama: ollama serve (runs on http://localhost:11434)
 * 
 * Usage:
 *   pnpm tsx apps/api/test-ollama-nextjs.ts
 */

import { CodeGenerationService } from './src/services/CodeGenerationService'

const service = new CodeGenerationService()

async function testOllamaGeneration(prompt: string) {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🤖 Testing Ollama Next.js Generation')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`\n📝 Prompt: "${prompt}"\n`)
  
  const startTime = Date.now()
  
  try {
    const result = await service.generateCode(prompt)
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    
    console.log('✅ Generation successful!')
    console.log(`⏱️  Time: ${elapsed}s`)
    console.log(`🔧 Provider: ${result.provider}`)
    console.log(`💾 Cached: ${result.cached}`)
    console.log(`📁 Files generated: ${result.files.length}`)
    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('📂 Generated Files:')
    console.log('═══════════════════════════════════════════════════════════\n')
    
    result.files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.path}`)
      console.log(`   Lines: ${file.content.split('\n').length}`)
      console.log(`   Size: ${(file.content.length / 1024).toFixed(1)} KB`)
      console.log()
    })
    
    // Show first 50 lines of package.json if available
    const packageJson = result.files.find(f => f.path === 'package.json')
    if (packageJson) {
      console.log('═══════════════════════════════════════════════════════════')
      console.log('📦 package.json Preview:')
      console.log('═══════════════════════════════════════════════════════════\n')
      console.log(packageJson.content.split('\n').slice(0, 30).join('\n'))
      console.log('\n...')
    }
    
    // Show statistics
    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('📊 Service Statistics:')
    console.log('═══════════════════════════════════════════════════════════\n')
    const stats = service.getStats()
    console.log(`Total Requests: ${stats.totalRequests}`)
    console.log(`Cache Hits: ${stats.cacheHits} (${((stats.cacheHits / stats.totalRequests) * 100).toFixed(1)}%)`)
    console.log(`Ollama Calls: ${stats.ollamaCalls}`)
    console.log(`Groq Calls: ${stats.groqCalls}`)
    console.log(`HuggingFace Calls: ${stats.hfCalls}`)
    console.log(`Errors: ${stats.errors}`)
    
    return result
    
  } catch (error: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    
    console.error(`\n❌ Generation failed after ${elapsed}s`)
    console.error(`Error: ${error.message}`)
    
    if (error.message.includes('Ollama not running')) {
      console.error('\n💡 Fix: Start Ollama with: ollama serve')
    } else if (error.message.includes('model') && error.message.includes('not found')) {
      console.error('\n💡 Fix: Pull a model first:')
      console.error('   ollama pull deepseek-coder:6.7b')
      console.error('   OR')
      console.error('   ollama pull qwen2.5-coder:7b')
    }
    
    throw error
  }
}

// Test cases
const testCases = [
  {
    name: 'Simple Todo App',
    prompt: 'A modern todo list with categories, dark mode toggle, localStorage persistence, and responsive design'
  },
  {
    name: 'E-commerce Product Catalog',
    prompt: 'An e-commerce product catalog with filtering, sorting, shopping cart, and checkout flow'
  },
  {
    name: 'Blog Platform',
    prompt: 'A blog platform with markdown editor, tag filtering, search, and reading time estimates'
  },
  {
    name: 'Dashboard',
    prompt: 'An analytics dashboard with charts, data tables, filters, and export functionality'
  }
]

// Run tests
async function runTests() {
  console.log('🚀 Starting Ollama Next.js Generation Tests\n')
  
  // Check Ollama health first
  const health = await service.healthCheck()
  console.log('Health Check:')
  console.log(JSON.stringify(health, null, 2))
  console.log()
  
  if (health.ollama.available) {
    console.log('✅ Ollama is running!')
    console.log(`   Model: ${health.ollama.model}`)
    console.log()
  } else {
    console.error('❌ Ollama is not available')
    console.error('   Make sure Ollama is running: ollama serve')
    console.error('   And a model is pulled: ollama pull deepseek-coder:6.7b')
    process.exit(1)
  }
  
  // Get test case from command line or use first one
  const testIndex = process.argv[2] ? parseInt(process.argv[2]) - 1 : 0
  const testCase = testCases[testIndex] || testCases[0]
  
  console.log(`Running test: ${testCase.name}\n`)
  
  try {
    await testOllamaGeneration(testCase.prompt)
    console.log('\n✅ Test completed successfully!')
  } catch (error) {
    console.error('\n❌ Test failed')
    process.exit(1)
  }
}

// Show usage if --help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Ollama Next.js Generation Test

Usage:
  pnpm tsx apps/api/test-ollama-nextjs.ts [test-number]

Test Cases:
  1. ${testCases[0].name}
  2. ${testCases[1].name}
  3. ${testCases[2].name}
  4. ${testCases[3].name}

Examples:
  pnpm tsx apps/api/test-ollama-nextjs.ts     # Run test 1
  pnpm tsx apps/api/test-ollama-nextjs.ts 2   # Run test 2
  `)
  process.exit(0)
}

// Run
runTests().catch(console.error)
