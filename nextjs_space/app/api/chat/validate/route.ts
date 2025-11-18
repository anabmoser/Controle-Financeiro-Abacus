
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages = [], ocrData, action } = body

    let systemPrompt = `Você é um assistente inteligente de controle de compras para restaurante.

DADOS EXTRAÍDOS DO CUPOM FISCAL:
${JSON.stringify(ocrData, null, 2)}

INSTRUÇÕES:
1. Apresente os dados extraídos de forma clara e organizada
2. Faça perguntas específicas para validar informações ambíguas
   Exemplo: "Vi 'tomate' no cupom. É tomate italiano, cereja ou comum?"
3. Confirme o entendimento após cada correção do usuário
4. Seja conciso, objetivo e amigável
5. Use emoji para tornar a conversa mais agradável 🙂
6. Quando todos os dados estiverem validados, pergunte se pode salvar

CATEGORIAS DISPONÍVEIS:
- Hortifruti, Carnes e Peixes, Laticínios, Grãos e Cereais, Bebidas, 
  Temperos e Condimentos, Limpeza, Descartáveis, Outros

Responda sempre em português brasileiro.`

    if (action === 'start') {
      // Mensagem inicial
      systemPrompt += `\n\nApresente os dados extraídos e comece a validação.`
      messages.unshift({
        role: 'system',
        content: systemPrompt,
      })
      messages.push({
        role: 'user',
        content: 'Olá, processou meu cupom fiscal?',
      })
    } else {
      // Continuar conversa
      messages.unshift({
        role: 'system',
        content: systemPrompt,
      })
    }

    // Stream da resposta
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages,
        stream: true,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      throw new Error('Erro na chamada da API LLM')
    }

    // Criar stream para o cliente
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  break
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed?.choices?.[0]?.delta?.content

                  if (content) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ content })}\n\n`
                      )
                    )
                  }
                } catch (e) {
                  // Ignorar erros de parsing
                }
              }
            }
          }
        } catch (error) {
          console.error('Erro no stream:', error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Erro no chat:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar chat' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
