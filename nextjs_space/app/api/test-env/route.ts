import { NextResponse } from 'next/server'

// Build: 2026-01-09 20:50 - Forçar deploy v2
export const dynamic = 'force-dynamic'

export async function GET() {
  const apiKey = process.env.ABACUSAI_API_KEY || 'NOT_FOUND'
  const last6 = apiKey.slice(-6)
  const first6 = apiKey.slice(0, 6)
  const keyLength = apiKey.length
  const buildVersion = 'v8-hardcoded-test'
  
  // Testar se a API Key funciona (usando gpt-4o-mini - mais barato)
  // TESTE: Usar chave hardcoded para debug
  const hardcodedKey = '4a32bb98d61043c698e617aafb550070'
  const keyToUse = hardcodedKey // Teste com chave hardcoded
  
  let testResult = 'NOT_TESTED'
  try {
    const testResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyToUse}`
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
    keyStart: `${first6}...`,
    keyEnding: `...${last6}`,
    keyLength,
    buildVersion,
    timestamp: new Date().toISOString(),
    testResult
  })
}
