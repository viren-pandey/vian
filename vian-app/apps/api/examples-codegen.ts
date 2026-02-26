/**
 * Example usage of the Zero-Cost AI Code Generator
 */

// ━━━ Example 1: Basic Code Generation ━━━

const example1 = async () => {
  const response = await fetch('http://localhost:4000/api/codegen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Create a TypeScript function to debounce user input'
    })
  })

  const data = await response.json()
  
  if (data.success) {
    console.log('Generated files:', data.files)
    console.log('Provider used:', data.provider) // 'groq' or 'huggingface'
    console.log('From cache:', data.cached) // true/false
  }
}

// ━━━ Example 2: React Component Generation ━━━

const example2 = async () => {
  const response = await fetch('http://localhost:4000/api/codegen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Create a React component for a loading spinner with Tailwind CSS'
    })
  })

  const data = await response.json()
  
  // Access generated code
  data.files.forEach((file: { path: string; content: string }) => {
    console.log(`File: ${file.path}`)
    console.log(`Content:\n${file.content}`)
  })
}

// ━━━ Example 3: API Route Generation ━━━

const example3 = async () => {
  const response = await fetch('http://localhost:4000/api/codegen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Create Express API routes for user CRUD operations with TypeScript'
    })
  })

  const data = await response.json()
  console.log(data.files[0].content)
}

// ━━━ Example 4: Hook Generation ━━━

const example4 = async () => {
  const response = await fetch('http://localhost:4000/api/codegen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Create a React hook for managing form state with validation'
    })
  })

  const data = await response.json()
  
  // Save to file
  const fsModule = await import('fs')
  data.files.forEach((file: { path: string; content: string }) => {
    fsModule.writeFileSync(file.path, file.content)
    console.log(`Saved: ${file.path}`)
  })
}

// ━━━ Example 5: Check Service Statistics ━━━

const example5 = async () => {
  const response = await fetch('http://localhost:4000/api/codegen/stats')
  const data = await response.json()
  
  console.log('Service Statistics:')
  console.log(`  Total requests: ${data.stats.totalRequests}`)
  console.log(`  Cache hit rate: ${data.stats.cacheHitRate}`)
  console.log(`  API calls made: ${data.stats.totalApiCalls}`)
  console.log(`  Estimated cost: ${data.stats.estimatedCost}`) // Always $0.00!
}

// ━━━ Example 6: Health Check ━━━

const example6 = async () => {
  const response = await fetch('http://localhost:4000/api/codegen/health')
  const data = await response.json()
  
  console.log('Provider Status:')
  console.log(`  Groq: ${data.groq ? 'Online ✓' : 'Offline ✗'}`)
  console.log(`  HuggingFace: ${data.huggingface ? 'Online ✓' : 'Offline ✗'}`)
  console.log(`  Overall: ${data.status}`) // 'healthy', 'degraded', or 'down'
}

// ━━━ Example 7: Error Handling ━━━

const example7 = async () => {
  try {
    const response = await fetch('http://localhost:4000/api/codegen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a complex AI system'
      })
    })

    const data = await response.json()
    
    if (!data.success) {
      console.error('Error:', data.message)
      console.error('Details:', data.error)
    }
  } catch (error) {
    console.error('Request failed:', error)
  }
}

// ━━━ Example 8: Cache Clearing (Admin) ━━━

const example8 = async () => {
  const response = await fetch('http://localhost:4000/api/codegen/cache/clear', {
    method: 'POST'
  })

  const data = await response.json()
  console.log(data.message) // "Cache cleared successfully"
}

// ━━━ Example 9: Multiple Requests (Cache Efficiency) ━━━

const example9 = async () => {
  const prompt = 'Create a pagination component'

  // First request - calls API
  const res1 = await fetch('http://localhost:4000/api/codegen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  })
  const data1 = await res1.json()
  console.log('Request 1 - Cached:', data1.cached) // false

  // Second request - uses cache (0 API calls!)
  const res2 = await fetch('http://localhost:4000/api/codegen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  })
  const data2 = await res2.json()
  console.log('Request 2 - Cached:', data2.cached) // true ✓
  console.log('Response time: <100ms (instant!)')
}

// ━━━ Example 10: Integration with Frontend ━━━

const example10_frontend = `
// React component using the codegen service

import { useState } from 'react'

export function CodeGenerator() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const generateCode = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('http://localhost:4000/api/codegen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data)
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <textarea 
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe what you want to build..."
      />
      
      <button onClick={generateCode} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Code'}
      </button>

      {result && (
        <div>
          <p>Provider: {result.provider}</p>
          <p>Cached: {result.cached ? 'Yes ✓' : 'No'}</p>
          <p>Cost: $0.00</p>
          
          {result.files.map(file => (
            <div key={file.path}>
              <h3>{file.path}</h3>
              <pre>{file.content}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
`

console.log(example10_frontend)

// Run examples
// example1()
// example2()
// etc.
