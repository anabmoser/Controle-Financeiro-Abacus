
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { downloadFile } from '@/lib/s3'

export const dynamic = 'force-dynamic'

// Função auxiliar para segunda tentativa focada em itens
// Usa GPT-4o - melhor modelo disponível na API Abacus.AI para visão e OCR
async function extractItemsOnly(base64: string, fileType: string) {
  const isImage = fileType?.startsWith('image/')
  
  const focusedPrompt = `Você é um modelo de IA avançado com capacidades de VISÃO COMPUTACIONAL e OCR.

🎯 TAREFA: Ler esta imagem de cupom fiscal e extrair APENAS os produtos REALMENTE VISÍVEIS.

⚠️ INSTRUÇÕES CRÍTICAS:
- Use sua VISÃO COMPUTACIONAL para LER a imagem
- Identifique visualmente cada linha de produto
- Extraia APENAS texto que está REALMENTE IMPRESSO
- NUNCA invente produtos ("Produto 1", "Item A", etc.)
- Se NÃO conseguir LER claramente, retorne lista VAZIA
- É MELHOR retornar 0 itens do que itens FALSOS

📸 PROCESSO DE LEITURA VISUAL:

PASSO 1: LOCALIZE visualmente a área de produtos no cupom
- Está entre o cabeçalho (topo) e o rodapé (total)
- Geralmente é a maior seção com várias linhas

PASSO 2: LEIA cada linha de produto que você VÊ
- Linha por linha, de cima para baixo
- Copie o nome EXATAMENTE como está impresso
- Extraia os números visíveis (quantidade, preços)

PASSO 3: VALIDE antes de adicionar
- O produto está REALMENTE na imagem?
- Consegui LER claramente o nome?
- Os números são REAIS (não inventados)?
- Se SIM → adicione na lista
- Se NÃO → pule este item

📝 FORMATO DE RESPOSTA:

Retorne JSON com APENAS os produtos que você REALMENTE VÊ:
{
  "itens": [
    {"nome": "NOME_REAL_DO_PRODUTO", "quantidade": 1.0, "preco_unitario": 9.99, "preco_total": 9.99}
  ]
}

Se não vê produtos claramente, retorne:
{
  "itens": []
}

⚠️ LEMBRE-SE: QUALIDADE é mais importante que QUANTIDADE. É preferível retornar 2 itens corretos do que 10 itens inventados!`

  const messages = [
    {
      role: 'user',
      content: isImage
        ? [
            { type: 'text', text: focusedPrompt },
            {
              type: 'image_url',
              image_url: { url: `data:${fileType};base64,${base64}` },
            },
          ]
        : focusedPrompt,
    },
  ]

  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 3000,
      temperature: 0.0,  // Zero para evitar inventar dados
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    throw new Error('Falha na segunda tentativa de extração')
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('Resposta vazia na segunda tentativa')
  }

  const parsed = JSON.parse(content)
  return parsed?.itens || parsed?.items || []
}

// Função para processar documento com LLM
// Usa GPT-4o - melhor modelo disponível na API Abacus.AI para OCR e visão
async function processDocumentWithLLM(fileUrl: string, fileType: string) {
  try {
    // Baixar arquivo
    const signedUrl = await downloadFile(fileUrl)
    const response = await fetch(signedUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    // Para PDFs, enviar como file data; para imagens, como image_url
    const isImage = fileType?.startsWith('image/')
    
    const promptText = `Você é um modelo de IA avançado (GPT-4o) com capacidades de VISÃO COMPUTACIONAL e OCR.

🎯 TAREFA: LER visualmente esta imagem de cupom fiscal brasileiro e extrair dados reais.

⚠️ REGRAS CRÍTICAS:
- Use sua VISÃO para LER o que está REALMENTE IMPRESSO
- NUNCA invente dados ("Produto 1", "Estabelecimento Exemplo")
- Se NÃO conseguir ler claramente, use null
- É MELHOR retornar poucos dados CORRETOS do que muitos dados FALSOS
- Confie na sua capacidade de visão para ler texto real

🔍 ANÁLISE VISUAL DO CUPOM FISCAL:

IMPORTANTE: Você está vendo a IMAGEM REAL do cupom. Leia o texto EXATAMENTE como aparece na imagem.

Identifique visualmente:

1️⃣ CABEÇALHO (Topo do cupom):
   - Nome do estabelecimento (geralmente em MAIÚSCULAS)
   - CNPJ (formato XX.XXX.XXX/XXXX-XX)
   - Endereço e dados da loja

2️⃣ CORPO - ÁREA DE PRODUTOS (Use sua VISÃO):
   
   🔍 Use sua capacidade de OCR avançado para:
   
   PASSO 1 - LOCALIZE visualmente a área de produtos:
   - Está ENTRE o cabeçalho (topo) e o rodapé (total/pagamento)
   - Geralmente é a seção MAIOR do cupom
   - Tem várias linhas sequenciais com estrutura similar
   - Cada linha tem texto + números (preços)
   
   PASSO 2 - IDENTIFIQUE o padrão visual dos produtos:
   - Podem ter código numérico no início
   - Têm nome/descrição do produto
   - Têm quantidade e/ou valores
   - Estrutura se repete linha após linha
   
   PASSO 3 - LEIA cada produto que você VÊ:
   - Use OCR para extrair o texto da linha
   - Copie EXATAMENTE o nome impresso
   - Extraia os números visíveis (qtd, preços)
   - Se não conseguir ler claramente, PULE
   
   ⚠️ IMPORTANTE:
   - Confie na sua capacidade de VISÃO COMPUTACIONAL
   - Você consegue VER e LER o texto impresso
   - NÃO invente - apenas extraia o que VÊ
   - É melhor retornar poucos itens REAIS do que muitos FALSOS

3️⃣ RODAPÉ (Final do cupom):
   - SUBTOTAL
   - DESCONTOS (se houver)
   - TOTAL (valor final pago)
   - Forma de pagamento
   - Data e hora da compra

📋 FORMATO JSON EXIGIDO:

{
  "fornecedor": "Nome REAL (ou null)",
  "cnpj": "CNPJ REAL (ou null)",
  "data": "YYYY-MM-DD REAL (ou null)",
  "total": 99.99,
  "itens": [
    {
      "nome": "NOME REAL QUE VOCÊ VÊ",
      "quantidade": 1.5,
      "preco_unitario": 9.99,
      "preco_total": 14.99
    }
  ]
}

⚠️ REGRAS ABSOLUTAS ANTI-ALUCINAÇÃO:

1. APENAS extraia produtos que você VÊ CLARAMENTE na imagem
2. NUNCA invente nomes como "Produto 1", "Item A", "Arroz Branco" genérico
3. Se NÃO conseguir ler um produto, PULE-O
4. É MELHOR retornar 0 itens do que itens FALSOS
5. Use null para campos que não consegue ler
6. NUNCA use os exemplos abaixo como dados reais

🎯 EXEMPLO ILUSTRATIVO (NÃO USE COMO DADOS REAIS):

⚠️ O exemplo abaixo é APENAS para mostrar o formato. NUNCA copie esses dados!

SE o cupom mostrasse:
SUPERMERCADO XYZ
001 ARROZ BRANCO 5KG = 37.80

ENTÃO você retornaria:
{
  "fornecedor": "SUPERMERCADO XYZ",
  "itens": [
    {"nome": "ARROZ BRANCO 5KG", "preco_total": 37.80}
  ]
}

✅ CHECKLIST ANTI-ALUCINAÇÃO ANTES DE RETORNAR:
□ Cada produto que listei está REALMENTE VISÍVEL na imagem?
□ Copiei os nomes EXATAMENTE como aparecem?
□ Extraí APENAS números que estão IMPRESSOS?
□ NÃO inventei nomes genéricos como "Produto 1"?
□ NÃO criei preços aleatórios?
□ Se não vejo produtos claramente, retornei itens: []?

🚫 ERROS GRAVÍSSIMOS A EVITAR:
- ❌ INVENTAR produtos que não estão na imagem
- ❌ Usar exemplos genéricos ("Produto A", "Item 1")
- ❌ Criar dados quando a imagem está ilegível
- ❌ Copiar os exemplos acima como dados reais
- Confundir subtotal com itens
- Não ler produtos em múltiplas linhas

Retorne APENAS o JSON válido, sem texto adicional.`

    const messages = [
      {
        role: 'user',
        content: isImage
          ? [
              {
                type: 'text',
                text: promptText,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${fileType};base64,${base64}`,
                },
              },
            ]
          : promptText,
      },
    ]

    // Chamar LLM API
    const llmResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 4000,
        temperature: 0.0,  // Zero para evitar criatividade/alucinação
        response_format: { type: 'json_object' },
      }),
    })

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text()
      console.error('Erro LLM API:', errorText)
      throw new Error(`Erro na chamada da API LLM: ${llmResponse.status} - ${errorText}`)
    }

    const llmData = await llmResponse.json()
    const content = llmData?.choices?.[0]?.message?.content

    if (!content) {
      console.error('Resposta LLM completa:', JSON.stringify(llmData))
      throw new Error('Resposta vazia da LLM')
    }

    // Parse JSON response
    let extractedData
    try {
      extractedData = JSON.parse(content)
      console.log('Dados extraídos com sucesso:', JSON.stringify(extractedData, null, 2))
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', content)
      throw new Error('Resposta da LLM não está em formato JSON válido')
    }

    // Estruturar dados no formato esperado
    let itemsRaw = extractedData?.items || extractedData?.itens || extractedData?.produtos || []
    
    // Validar se extraiu itens - SE NÃO, fazer segunda tentativa
    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
      console.warn('⚠️ PRIMEIRA TENTATIVA: Nenhum item extraído')
      console.warn('Dados brutos:', JSON.stringify(extractedData, null, 2))
      console.log('🔄 Iniciando SEGUNDA TENTATIVA focada em itens...')
      
      try {
        itemsRaw = await extractItemsOnly(base64, fileType)
        console.log(`✅ SEGUNDA TENTATIVA bem-sucedida! ${itemsRaw.length} itens encontrados`)
      } catch (retryError) {
        console.error('❌ SEGUNDA TENTATIVA falhou:', retryError)
        console.warn('⚠️ Continuando sem itens extraídos')
      }
    }

    const result = {
      supplierName: extractedData?.supplier_name || extractedData?.fornecedor || extractedData?.supplier || 'Fornecedor Desconhecido',
      supplierCnpj: extractedData?.cnpj || extractedData?.supplier_cnpj || null,
      purchaseDate: extractedData?.date || extractedData?.data || extractedData?.purchase_date || new Date().toISOString().split('T')[0],
      totalAmount: parseFloat(extractedData?.total || extractedData?.total_amount || extractedData?.valor_total || 0),
      items: itemsRaw.map((item: any) => ({
        name: item?.name || item?.produto || item?.description || item?.nome || 'Item Sem Nome',
        quantity: parseFloat(item?.quantity || item?.quantidade || item?.qtd || 1),
        unitPrice: parseFloat(item?.unit_price || item?.preco_unitario || item?.valor_unitario || item?.price || 0),
        totalPrice: parseFloat(item?.total_price || item?.preco_total || item?.valor_total || item?.total || 0),
      })),
      // Adicionar aviso se não extraiu itens
      warning: itemsRaw.length === 0 ? 'Nenhum item foi extraído. Verifique se a imagem está legível.' : undefined
    }

    console.log('✅ Dados estruturados:', JSON.stringify(result, null, 2))
    console.log(`📊 Total de itens extraídos: ${result.items.length}`)
    
    return result
  } catch (error: any) {
    console.error('Erro no processamento com LLM:', error)
    const errorMessage = error?.message || 'Erro desconhecido no processamento'
    throw new Error(`Falha no processamento do documento: ${errorMessage}`)
  }
}

export async function POST(request: NextRequest) {
  let receiptId: string | undefined
  
  try {
    const body = await request.json()
    receiptId = body.receiptId
    const { cloudStoragePath } = body

    if (!receiptId) {
      return NextResponse.json({ error: 'receiptId não fornecido' }, { status: 400 })
    }

    // Buscar receipt
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt não encontrado' }, { status: 404 })
    }

    // Atualizar status
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { ocrStatus: 'processing' },
    })

    // Processar documento com LLM
    const ocrData = await processDocumentWithLLM(
      cloudStoragePath || receipt.fileUrl,
      receipt.fileType || 'image/jpeg'
    )

    // Salvar resultado
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        ocrStatus: 'completed',
        ocrResult: ocrData as any,
        processedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: ocrData,
    })
  } catch (error: any) {
    console.error('Erro no processamento OCR:', error)
    const errorMessage = error?.message || 'Erro desconhecido'
    
    // Atualizar status como erro
    if (receiptId) {
      try {
        await prisma.receipt.update({
          where: { id: receiptId },
          data: { 
            ocrStatus: 'error',
            ocrResult: { error: errorMessage } as any
          },
        })
      } catch (e) {
        console.error('Erro ao atualizar status:', e)
      }
    }

    return NextResponse.json(
      { 
        error: 'Erro ao processar documento',
        details: errorMessage,
        suggestion: 'Verifique se a imagem está legível e tente novamente'
      },
      { status: 500 }
    )
  }
}
