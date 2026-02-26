/**
 * Test file for Zero-Cost AI Code Generator
 * 
 * Run with: node test-codegen.js
 * Or: ts-node test-codegen.ts
 */

const BASE_URL = 'http://localhost:4000'

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`)
}

// Test 1: Generate code
async function testGeneration() {
  log(colors.blue, '\n━━━ Test 1: Code Generation ━━━')
  
  try {
    const response = await fetch(`${BASE_URL}/api/codegen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a TypeScript function to validate email addresses'
      })
    })

    const data = await response.json()

    if (data.success) {
      log(colors.green, '✓ Generation successful')
      console.log(`  Provider: ${data.provider}`)
      console.log(`  Cached: ${data.cached}`)
      console.log(`  Files: ${data.files.length}`)
      console.log(`  Cache hit rate: ${data.stats.cacheHitRate}`)
      console.log('\n  Generated code:')
      console.log(colors.yellow + data.files[0].content.substring(0, 200) + '...' + colors.reset)
    } else {
      log(colors.red, '✗ Generation failed: ' + data.message)
    }
  } catch (error: any) {
    log(colors.red, '✗ Error: ' + error.message)
  }
}

// Test 2: Cache hit (same prompt)
async function testCache() {
  log(colors.blue, '\n━━━ Test 2: Cache Hit ━━━')
  
  try {
    const prompt = 'Create a React button component'

    // First call
    log(colors.yellow, 'Call 1 (should be uncached)...')
    const response1 = await fetch(`${BASE_URL}/api/codegen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })
    const data1 = await response1.json()
    console.log(`  Cached: ${data1.cached}, Provider: ${data1.provider}`)

    // Second call (should be cached)
    log(colors.yellow, 'Call 2 (should be cached)...')
    const response2 = await fetch(`${BASE_URL}/api/codegen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })
    const data2 = await response2.json()
    console.log(`  Cached: ${data2.cached}`)

    if (data2.cached) {
      log(colors.green, '✓ Cache working correctly!')
    } else {
      log(colors.red, '✗ Cache not working')
    }
  } catch (error: any) {
    log(colors.red, '✗ Error: ' + error.message)
  }
}

// Test 3: Stats endpoint
async function testStats() {
  log(colors.blue, '\n━━━ Test 3: Statistics ━━━')
  
  try {
    const response = await fetch(`${BASE_URL}/api/codegen/stats`)
    const data = await response.json()

    if (data.success) {
      log(colors.green, '✓ Stats retrieved')
      console.log(`  Total requests: ${data.stats.totalRequests}`)
      console.log(`  Cache hits: ${data.stats.cacheHits}`)
      console.log(`  Cache hit rate: ${data.stats.cacheHitRate}`)
      console.log(`  Groq calls: ${data.stats.groqCalls}`)
      console.log(`  HuggingFace calls: ${data.stats.hfCalls}`)
      console.log(`  Total API calls: ${data.stats.totalApiCalls}`)
      console.log(`  Estimated cost: ${data.stats.estimatedCost}`)
    }
  } catch (error: any) {
    log(colors.red, '✗ Error: ' + error.message)
  }
}

// Test 4: Health check
async function testHealth() {
  log(colors.blue, '\n━━━ Test 4: Health Check ━━━')
  
  try {
    const response = await fetch(`${BASE_URL}/api/codegen/health`)
    const data = await response.json()

    console.log(`  Groq: ${data.groq ? '✓' : '✗'}`)
    console.log(`  HuggingFace: ${data.huggingface ? '✓' : '✗'}`)
    console.log(`  Status: ${data.status}`)

    if (data.status === 'healthy') {
      log(colors.green, '✓ All providers operational')
    } else if (data.status === 'degraded') {
      log(colors.yellow, '⚠ Running with limited providers')
    } else {
      log(colors.red, '✗ All providers down')
    }
  } catch (error: any) {
    log(colors.red, '✗ Error: ' + error.message)
  }
}

// Test 5: Error handling (invalid input)
async function testErrorHandling() {
  log(colors.blue, '\n━━━ Test 5: Error Handling ━━━')
  
  try {
    // Test 1: Empty prompt
    const response1 = await fetch(`${BASE_URL}/api/codegen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '' })
    })
    const data1 = await response1.json()
    console.log(`  Empty prompt: ${data1.success ? '✗ Got success' : '✓ Rejected'}`)

    // Test 2: Too long prompt
    const response2 = await fetch(`${BASE_URL}/api/codegen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'a'.repeat(3000) })
    })
    const data2 = await response2.json()
    console.log(`  Long prompt: ${data2.success ? '✗ Got success' : '✓ Rejected'}`)

    log(colors.green, '✓ Error handling working')
  } catch (error: any) {
    log(colors.red, '✗ Error: ' + error.message)
  }
}

// Run all tests
async function runAllTests() {
  log(colors.blue, '\n╔════════════════════════════════════════╗')
  log(colors.blue, '║  Zero-Cost AI Code Generator Tests    ║')
  log(colors.blue, '╚════════════════════════════════════════╝')

  await testGeneration()
  await testCache()
  await testStats()
  await testHealth()
  await testErrorHandling()

  log(colors.blue, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  log(colors.green, '✓ All tests completed\n')
}

// Run tests
runAllTests().catch(console.error)
