import { NextResponse } from 'next/server'

// Build: 2026-01-09 20:50 - Forçar deploy v2
export const dynamic = 'force-dynamic'

export async function GET() {
  const apiKey = process.env.ABACUSAI_API_KEY || 'NOT_FOUND'
  const last6 = apiKey.slice(-6)
  const buildVersion = 'v3-2026-01-09-2100'
  
  // Testar se a API Key funciona (usando gpt-4o-mini - mais barato)
  let testResult = 'NOT_TESTED'
  try {
    const testResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{role: 'user', content: 'OK'}],
        max_tokens: 3
      })
    })
    
    if (testResponse.ok) {
      testResult = 'SUCCESS'
    } else {
      const errorData = await testResponse.json()
      testResult = `ERROR: ${JSON.stringify(errorData)}`
    }
  } catch (error: any) {
    testResult = `EXCEPTION: ${error.message}`
  }
  
  return NextResponse.json({
    hasKey: !!process.env.ABACUSAI_API_KEY,
    keyEnding: `...${last6}`,
    buildVersion,
    timestamp: new Date().toISOString(),
    testResult
  })
}
