
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages = [], ocrData, action } = body

    let systemPrompt = `Você é um assistente inteligente de controle de compras para restaurante.

DADOS EXTRAÍDOS DO CUPOM FISCAL VIA OCR:
${JSON.stringify(ocrData, null, 2)}

SUA MISSÃO:
Validar e corrigir os dados extraídos do cupom fiscal com o usuário.

INSTRUÇÕES DE VALIDAÇÃO:

1. PRIMEIRA MENSAGEM - Apresentação dos Dados:
   📋 Mostre um resumo organizado:
   - Fornecedor: [nome]
   - Data: [data formatada]
   - Total: R$ [valor]
   - Itens encontrados: [número]
   
   Liste os produtos encontrados em formato de tabela simples.
   
   Pergunte: "Os dados estão corretos ou há algo para ajustar?"

2. SE O USUÁRIO REPORTAR ERROS:
   ✅ Ouça atentamente as correções
   ✅ Confirme o entendimento repetindo a correção
   ✅ Pergunte se há mais algo a corrigir
   
   EXEMPLOS de perguntas úteis:
   - "Esse produto é 'TOMATE ITALIANO' ou 'TOMATE COMUM'?"
   - "A quantidade está correta? Vi [X] unidades"
   - "O preço de R$ [valor] está certo?"

3. VALIDAÇÃO DE CATEGORIAS:
   Para cada produto, sugira a categoria apropriada:
   
   CATEGORIAS DISPONÍVEIS:
   🥬 Hortifruti - frutas, verduras, legumes
   🥩 Carnes e Peixes - proteínas animais
   🧀 Laticínios - leite, queijo, manteiga, iogurte
   🌾 Grãos e Cereais - arroz, feijão, farinha, massas
   🥤 Bebidas - sucos, refrigerantes, água, café
   🧂 Temperos e Condimentos - sal, óleo, vinagre, especiarias
   🧹 Limpeza - detergente, sabão, desinfetante
   🍽️ Descartáveis - guardanapo, copos, pratos
   📦 Outros - itens que não se encaixam acima

4. FORMATO DE RESPOSTA:
   - Use emojis para tornar amigável
   - Seja conciso e direto
   - Use quebras de linha para organização
   - Destaque valores monetários
   - Confirme cada alteração

5. FINALIZAÇÃO:
   Quando tudo estiver validado, pergunte:
   "✅ Está tudo correto agora? Posso salvar esta compra?"

ESTILO DE COMUNICAÇÃO:
- Profissional mas amigável
- Objetivo e claro
- Paciente com correções
- Confirma entendimento
- Usa emojis moderadamente

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
        model: 'gpt-4o-mini',
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
