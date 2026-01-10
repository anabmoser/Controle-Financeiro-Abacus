
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { downloadFile } from '@/lib/s3'

export const dynamic = 'force-dynamic'

// Função auxiliar para segunda tentativa focada em itens
// Usa GPT-4o - melhor modelo disponível na API Abacus.AI para visão e OCR
async function extractItemsOnly(base64: string, fileType: string) {
  const isImage = fileType?.startsWith('image/')
  
  const focusedPrompt = `Você é um especialista em OCR de CUPONS FISCAIS BRASILEIROS.

🎯 FOCO ABSOLUTO: Extrair TODOS os produtos visíveis neste cupom fiscal.

⚠️ REGRAS:
1. USE sua visão para LER linha por linha
2. Procure por linhas com NOMES DE PRODUTOS + VALORES
3. Produtos ficam ENTRE o nome da loja (topo) e o TOTAL (embaixo)
4. NUNCA invente - só extraia o que VÊ
5. Lista vazia é melhor que dados falsos

📸 EXEMPLOS DO QUE PROCURAR NA IMAGEM:

Você vai VER linhas como:

✅ "ARROZ INTEGRAL 1KG"
✅ "FEIJAO CARIOCA"  
✅ "OLEO DE SOJA 900ML"
✅ "ACUCAR CRISTAL 1KG"
✅ "SAL REFINADO 1KG"
✅ "CAFE TRADICIONAL 500G"
✅ "LEITE INTEGRAL 1L"
✅ "MACARRAO PARAFUSO"

Seguidas de linhas com números:
✅ "1 UN x 5,90    5,90"
✅ "2 UN x 8,50   17,00"

🔍 ONDE PROCURAR:

Cupons brasileiros têm esta estrutura visual:

TOPO: NOME DO ESTABELECIMENTO (ignore)
TOPO: CNPJ: XX.XXX.XXX/XXXX-XX (ignore)
TOPO: Endereço (ignore)
---LINHA SEPARADORA---
MEIO: 001 PRODUTO NOME AQUI (EXTRAIA!)
MEIO: 1 UN x 10,00  10,00 (EXTRAIA!)
MEIO: 002 OUTRO PRODUTO (EXTRAIA!)
MEIO: 2 UN x 5,50  11,00 (EXTRAIA!)
MEIO: 003 MAIS UM PRODUTO (EXTRAIA!)
MEIO: 1 UN x 7,90  7,90 (EXTRAIA!)
---LINHA SEPARADORA---
RODAPÉ: SUBTOTAL 28,90 (ignore)
RODAPÉ: TOTAL 28,90 (ignore)

🎯 PROCESSO:

1. OLHE a imagem completa
2. ENCONTRE onde começam os produtos (após CNPJ/endereço)
3. ENCONTRE onde terminam (antes de SUBTOTAL/TOTAL)
4. LEIA cada linha entre esses pontos
5. EXTRAIA nome + valores de cada produto que VÊ

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
    const errorText = await response.text()
    console.error('❌ Erro na 2ª tentativa (HTTP):', errorText)
    throw new Error('Falha na segunda tentativa de extração')
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content

  console.log('📤 2ª Tentativa - Resposta bruta:', content?.substring(0, 400) + '...')

  if (!content) {
    console.error('❌ 2ª Tentativa - Resposta vazia!')
    throw new Error('Resposta vazia na segunda tentativa')
  }

  const parsed = JSON.parse(content)
  const items = parsed?.itens || parsed?.items || []
  
  console.log(`📦 2ª Tentativa - Total de itens: ${items.length}`)
  if (items.length > 0) {
    console.log(`📋 2ª Tentativa - Produtos:`, items.map((i: any) => i.nome || i.name).slice(0, 5).join(', '))
  } else {
    console.warn('⚠️ 2ª Tentativa - Nenhum item encontrado!')
  }
  
  return items
}

// Função para processar documento com LLM
// Usa GPT-4o - melhor modelo disponível na API Abacus.AI para OCR e visão
// Build v4: 2026-01-10 - Debug logging
async function processDocumentWithLLM(fileUrl: string, fileType: string) {
  // DEBUG: Logar informações da API Key
  const apiKey = process.env.ABACUSAI_API_KEY || ''
  const keyLast6 = apiKey.slice(-6)
  const keyLength = apiKey.length
  console.log(`🔑 OCR API Key: length=${keyLength}, ends=...${keyLast6}`)
  
  try {
    // Baixar arquivo
    const signedUrl = await downloadFile(fileUrl)
    console.log(`📥 Baixando arquivo: ${fileUrl.substring(0, 50)}...`)
    const response = await fetch(signedUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log(`📦 Arquivo baixado: ${buffer.length} bytes`)
    const base64 = buffer.toString('base64')

    // Para PDFs, enviar como file data; para imagens, como image_url
    const isImage = fileType?.startsWith('image/')
    
    const promptText = `Você é um especialista em OCR de CUPONS FISCAIS BRASILEIROS (NFCe).

🎯 TAREFA CRÍTICA: Extrair TODOS os produtos que você VÊ neste cupom fiscal.

⚠️ REGRAS ABSOLUTAS:
1. LEIA cada linha da imagem com sua visão computacional
2. Cupons brasileiros têm 40-80 caracteres de largura
3. Produtos estão SEMPRE entre o cabeçalho e o total
4. NUNCA invente produtos - só extraia o que VÊ
5. Se não vir NADA, retorne lista vazia

📸 COMO CUPONS FISCAIS BRASILEIROS APARECEM:

╔════════════════════════════════════╗
║ SUPERMERCADO XYZ LTDA             ║  ← CABEÇALHO
║ CNPJ: 12.345.678/0001-90          ║
║ R. Exemplo, 123 - São Paulo       ║
╠════════════════════════════════════╣
║ CUPOM FISCAL - NFCe               ║
║----------------------------------- ║
║ 001 ARROZ TIPO 1 5KG              ║  ← PRODUTOS
║     1 UN x 25,90          25,90   ║     (AQUI!)
║ 002 FEIJAO PRETO 1KG              ║
║     2 UN x 7,50           15,00   ║
║ 003 OLEO DE SOJA 900ML            ║
║     1 UN x 8,90            8,90   ║
║ 004 MACARRAO ESPAGUETE            ║
║     3 UN x 4,20           12,60   ║
║----------------------------------- ║
║ SUBTOTAL                   62,40  ║  ← RODAPÉ
║ DESCONTO                    5,00  ║
║ TOTAL                      57,40  ║
║ DINHEIRO                   60,00  ║
║ TROCO                       2,60  ║
╚════════════════════════════════════╝

🔍 LOCALIZE OS PRODUTOS NA IMAGEM:

Produtos estão na seção do meio (entre cabeçalho e total).

PADRÕES VISUAIS COMUNS:

Formato A (código + nome + qtd + preço):
  001 PRODUTO NOME AQUI
      2 UN x 10,00          20,00

Formato B (código  descrição  qtd  valor):
  123  PRODUTO NOME  1  UN  5,50  5,50

Formato C (descrição  qtd  valor):
  PRODUTO NOME AQUI    1  UN    12,90

Formato D (item compacto):
  PRODUTO NOME            15,00 F

🎯 PASSO A PASSO PARA EXTRAIR:

PASSO 1: OLHE a imagem e identifique:
  - Onde está escrito o nome da loja (topo)
  - Onde está escrito "TOTAL" ou "SUBTOTAL" (embaixo)
  
PASSO 2: A área ENTRE o topo e "TOTAL" tem os produtos

PASSO 3: LEIA cada linha dessa área:
  - Se tem nome + número = produto
  - Se não consegue ler = pule
  
PASSO 4: Para cada produto, extraia:
  - nome: o texto que você VÊ (ex: "ARROZ TIPO 1 5KG")
  - quantidade: número antes de "UN" (ex: 1, 2, 3)
  - precoUnitario: valor após "x" (ex: 25,90)
  - precoTotal: último valor da linha (ex: 25,90)

⚠️ EXEMPLOS REAIS DE LINHAS QUE VOCÊ VAI VER:

✅ "ARROZ TIPO 1 5KG"     → nome: "ARROZ TIPO 1 5KG"
✅ "1 UN x 25,90  25,90"  → qtd: 1, preço: 25,90
✅ "FEIJAO PRETO 1KG"     → nome: "FEIJAO PRETO 1KG"
✅ "OLEO DE SOJA 900ML"   → nome: "OLEO DE SOJA 900ML"
✅ "MACARRAO ESPAGUETE"   → nome: "MACARRAO ESPAGUETE"

❌ NÃO invente nomes genéricos:
❌ "Produto 1", "Item A", "Produto Exemplo"

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
    const currentApiKey = process.env.ABACUSAI_API_KEY || ''
    console.log(`🚀 Chamando LLM API com key ...${currentApiKey.slice(-6)}, tamanho base64: ${base64.length} chars`)
    
    const requestBody = {
      model: 'gpt-4o',
      messages,
      max_tokens: 4000,
      temperature: 0.0,  // Zero para evitar criatividade/alucinação
      response_format: { type: 'json_object' },
    }
    
    const llmResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentApiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log(`📡 LLM Response status: ${llmResponse.status}`)
    
    if (!llmResponse.ok) {
      const errorText = await llmResponse.text()
      console.error(`❌ Erro LLM API (status ${llmResponse.status}):`, errorText)
      console.error(`❌ API Key usada: ...${currentApiKey.slice(-6)}`)
      throw new Error(`Erro na chamada da API LLM: ${llmResponse.status} - ${errorText}`)
    }

    const llmData = await llmResponse.json()
    const content = llmData?.choices?.[0]?.message?.content

    console.log('📤 RESPOSTA BRUTA DO GPT-4o:', content?.substring(0, 500) + '...')
    console.log('📊 Status da resposta:', llmResponse.status)

    if (!content) {
      console.error('❌ Resposta LLM vazia!')
      console.error('Resposta LLM completa:', JSON.stringify(llmData))
      throw new Error('Resposta vazia da LLM')
    }

    // Parse JSON response
    let extractedData
    try {
      extractedData = JSON.parse(content)
      console.log('✅ Dados extraídos com sucesso:', JSON.stringify(extractedData, null, 2))
      console.log(`📦 Número de itens encontrados: ${extractedData?.itens?.length || extractedData?.items?.length || 0}`)
      
      if (extractedData?.itens) {
        console.log(`📋 Itens extraídos:`, extractedData.itens.map((i: any) => i.nome || i.name).join(', '))
      }
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', content)
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
