import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const apiKey = process.env.ABACUSAI_API_KEY || 'NOT_FOUND'
  const last6 = apiKey.slice(-6)
  
  // Testar se a API Key funciona
  let testResult = 'NOT_TESTED'
  try {
    const testResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{role: 'user', content: 'test'}],
        max_tokens: 5
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
    timestamp: new Date().toISOString(),
    testResult
  })
}
