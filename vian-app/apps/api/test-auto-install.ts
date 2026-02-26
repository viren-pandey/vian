/**
 * Test script for auto-install feature
 * 
 * This demonstrates the new auto-install functionality where models
 * are automatically downloaded when selected.
 * 
 * Prerequisites:
 * 1. Install Ollama: https://ollama.ai
 * 2. Start Ollama: ollama serve
 * 3. That's it! No need to manually pull models
 * 
 * Usage:
 *   pnpm tsx apps/api/test-auto-install.ts
 */

import { codeGenService } from './src/services/CodeGenerationService'

async function testAutoInstall() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🤖 Testing Auto-Install Feature')
  console.log('═══════════════════════════════════════════════════════════\n')

  // 1. Check health
  console.log('📊 Checking system health...\n')
  const health = await codeGenService.healthCheck()
  console.log('Health Status:', JSON.stringify(health, null, 2))
  
  if (!health.ollama.available) {
    console.error('\n❌ Ollama is not running!')
    console.error('   Start it with: ollama serve')
    process.exit(1)
  }

  console.log('\n✅ Ollama is running!\n')

  // 2. List available models
  console.log('📋 Listing available models...\n')
  const availableModels = await codeGenService.listModels()
  console.log('Available models:', availableModels)
  console.log()

  // 3. Show current model
  console.log('🎯 Current model:', codeGenService.getCurrentModel())
  console.log()

  // 4. Select a model (will auto-install if not available)
  const testModel = 'qwen2.5-coder:7b'
  console.log(`🔄 Selecting model: ${testModel}`)
  console.log('   (Will auto-install if not already downloaded)\n')
  
  codeGenService.setModel(testModel)
  
  // 5. Generate code (this will trigger auto-install if needed)
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🚀 Generating Code with Auto-Install')
  console.log('═══════════════════════════════════════════════════════════\n')
  console.log('If the model is not installed, you will see:')
  console.log('  🔄 Pulling model: qwen2.5-coder:7b')
  console.log('  This may take 2-5 minutes for first-time download...')
  console.log('  ✅ Model installed successfully!')
  console.log('  Retrying generation...\n')
  
  const prompt = 'A simple counter component with increment and decrement buttons'
  
  try {
    const startTime = Date.now()
    const result = await codeGenService.generateCode(prompt)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    
    console.log('═══════════════════════════════════════════════════════════')
    console.log('✅ Success!')
    console.log('═══════════════════════════════════════════════════════════\n')
    console.log(`⏱️  Total time: ${elapsed}s`)
    console.log(`🔧 Provider: ${result.provider}`)
    console.log(`💾 Cached: ${result.cached}`)
    console.log(`📁 Files: ${result.files.length}`)
    console.log()
    
    console.log('Generated files:')
    result.files.forEach((file, i) => {
      console.log(`  ${i + 1}. ${file.path}`)
    })
    
    console.log()
    console.log('═══════════════════════════════════════════════════════════')
    console.log('🎉 Auto-Install Test Complete!')
    console.log('═══════════════════════════════════════════════════════════')
    console.log()
    console.log('Key Points:')
    console.log('  ✅ Model was automatically installed if not present')
    console.log('  ✅ Code was generated successfully')
    console.log('  ✅ Next time will be instant (model is cached)')
    console.log()
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.error('\nTroubleshooting:')
    console.error('  1. Make sure Ollama is running: ollama serve')
    console.error('  2. Check internet connection (for model download)')
    console.error('  3. Ensure enough disk space (~5 GB for model)')
    process.exit(1)
  }
}

// Run test
testAutoInstall().catch(console.error)
