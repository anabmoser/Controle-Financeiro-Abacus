
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, ocrData } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma mensagem fornecida' },
        { status: 400 }
      )
    }

    // Preparar prompt para IA extrair correções
    const extractionPrompt = `Você é um especialista em extrair correções de conversas sobre dados de cupons fiscais.

DADOS ORIGINAIS DO OCR:
${JSON.stringify(ocrData, null, 2)}

CONVERSA COM O USUÁRIO:
${messages
  .filter((m: any) => m.role !== 'system')
  .map((m: any) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
  .join('\n\n')}

TAREFA:
Analise a conversa e identifique TODAS as correções que o usuário fez nos dados.

RETORNE um JSON com a estrutura EXATA abaixo, aplicando as correções mencionadas:

{
  "supplierName": "Nome do fornecedor (corrigido se mencionado)",
  "supplierCnpj": "CNPJ (corrigido se mencionado)",
  "purchaseDate": "YYYY-MM-DD (corrigida se mencionada)",
  "totalAmount": 123.45,
  "paymentMethod": "forma de pagamento",
  "items": [
    {
      "name": "Nome do produto (corrigido)",
      "quantity": 1.0,
      "unitPrice": 10.00,
      "totalPrice": 10.00
    }
  ],
  "corrections": [
    "Lista de correções aplicadas para mostrar ao usuário"
  ]
}

REGRAS IMPORTANTES:
1. Se o usuário NÃO mencionou correção para um campo, mantenha o valor ORIGINAL do OCR
2. Se o usuário corrigiu nome de produto, atualize em "items"
3. Se o usuário corrigiu quantidade/preço, atualize os valores
4. Se o usuário adicionou novo produto, inclua em "items"
5. Se o usuário removeu produto, exclua de "items"
6. Liste todas as correções aplicadas em "corrections"
7. Se NÃO houve correções, retorne os dados originais e corrections: []

RESPONDA APENAS COM O JSON, SEM MARKDOWN OU EXPLICAÇÕES ADICIONAIS.`

    // Chamar API da Abacus.AI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um extrator de correções. Sempre responda com JSON válido.',
          },
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.0, // Zero para máxima precisão
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na API LLM:', errorText)
      throw new Error('Falha ao extrair correções')
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('Resposta vazia da API')
    }

    const correctedData = JSON.parse(content)

    console.log('✅ Correções extraídas:', correctedData.corrections)

    return NextResponse.json({
      success: true,
      correctedData,
    })
  } catch (error: any) {
    console.error('❌ Erro ao extrair correções:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar correções' },
      { status: 500 }
    )
  }
}
