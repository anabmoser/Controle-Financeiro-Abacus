
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { downloadFile } from '@/lib/s3'

export const dynamic = 'force-dynamic'

// Função auxiliar para segunda tentativa focada em itens
// Usa Gemini 2.0 Flash com capacidades avançadas de visão computacional
async function extractItemsOnly(base64: string, fileType: string) {
  const isImage = fileType?.startsWith('image/')
  
  const focusedPrompt = `🎯 FOCO LASER: Use sua VISÃO COMPUTACIONAL para extrair TODOS os produtos desta imagem de cupom fiscal.

📸 INSTRUÇÕES VISUAIS:

1. IGNORE o topo (cabeçalho) e o final (rodapé) do cupom
2. FOQUE APENAS na área CENTRAL onde estão listados os produtos
3. IDENTIFIQUE VISUALMENTE cada linha que representa um produto
4. LEIA o texto EXATAMENTE como aparece na imagem

🔍 O QUE PROCURAR VISUALMENTE:
- Linhas com nomes de produtos seguidos de números
- Área com múltiplas linhas similares (lista de itens)
- Valores monetários (R$ ou números decimais)
- Códigos numéricos antes dos nomes

📝 PARA CADA PRODUTO QUE VOCÊ VÊ:
- Copie o NOME exatamente como está impresso
- Extraia a QUANTIDADE (se visível, senão use 1.0)
- Extraia o PREÇO UNITÁRIO (se visível)
- Extraia o PREÇO TOTAL

✅ REGRA FUNDAMENTAL:
Se você VÊ produtos na imagem, você DEVE extrair eles!
NUNCA retorne lista vazia se houver itens visíveis.
Mesmo com texto borrado, tente ler o máximo possível.

Retorne JSON:
{
  "itens": [
    {"nome": "PRODUTO", "quantidade": 1.0, "preco_unitario": 9.99, "preco_total": 9.99}
  ]
}

Use sua capacidade de visão avançada do Gemini para ler TUDO que for possível!`

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
      model: 'gemini-2.0-flash-exp',
      messages,
      max_tokens: 3000,
      temperature: 0.2,
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
// Usa Gemini 2.0 Flash - modelo com excelentes capacidades de OCR e visão computacional
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
    
    const promptText = `Você é um especialista em OCR de CUPONS FISCAIS BRASILEIROS usando visão computacional avançada.

TAREFA CRÍTICA: Analisar a IMAGEM do cupom fiscal e extrair TODOS os produtos/itens visíveis.

🔍 ANÁLISE VISUAL DO CUPOM FISCAL:

IMPORTANTE: Você está vendo a IMAGEM REAL do cupom. Leia o texto EXATAMENTE como aparece na imagem.

Identifique visualmente:

1️⃣ CABEÇALHO (Topo do cupom):
   - Nome do estabelecimento (geralmente em MAIÚSCULAS)
   - CNPJ (formato XX.XXX.XXX/XXXX-XX)
   - Endereço e dados da loja

2️⃣ CORPO (Meio do cupom) - ÁREA MAIS IMPORTANTE:
   
   ⚠️ USE SUA VISÃO COMPUTACIONAL:
   - Identifique VISUALMENTE cada linha de produto
   - Leia o texto EXATAMENTE como está impresso
   - Produtos geralmente aparecem em linhas sequenciais
   - Cada produto tem um nome e valor associado
   
   📝 PADRÕES VISUAIS COMUNS:
   
   Padrão A: NOME DO PRODUTO    QTD x PREÇO = TOTAL
   Exemplo visual: "TOMATE ITALIANO KG  1.500 x 8.90 = 13.35"
   
   Padrão B: COD  DESCRIÇÃO    QTD  UN  VL UNIT  VL TOTAL
   Exemplo visual: "001  ARROZ TIPO 1    2   KG   4.50    9.00"
   
   Padrão C: PRODUTO              QUANT   VALOR
   Exemplo visual: "FEIJAO PRETO 1KG     1 UN    6.50"

   🎯 LOCALIZE VISUALMENTE A ÁREA DE ITENS:
   - Está ENTRE o cabeçalho (topo) e o total (rodapé)
   - Linhas que contêm valores monetários (R$ ou números decimais)
   - Linhas que começam com códigos numéricos ou nomes
   - Área com múltiplas linhas de texto semelhantes
   - Geralmente a maior seção do cupom
   
   ⚠️ INSTRUÇÕES DE LEITURA VISUAL:
   - LEIA LINHA POR LINHA da área central
   - NÃO pule nenhuma linha com produto
   - Se o texto estiver borrado, tente ler o que for possível
   - Priorize a extração de TODOS os itens, mesmo que alguns dados estejam incompletos

3️⃣ RODAPÉ (Final do cupom):
   - SUBTOTAL
   - DESCONTOS (se houver)
   - TOTAL (valor final pago)
   - Forma de pagamento
   - Data e hora da compra

📋 FORMATO JSON EXIGIDO:

{
  "fornecedor": "Nome do estabelecimento",
  "cnpj": "00.000.000/0000-00",
  "data": "YYYY-MM-DD",
  "total": 99.99,
  "itens": [
    {
      "nome": "NOME COMPLETO DO PRODUTO",
      "quantidade": 1.5,
      "preco_unitario": 9.99,
      "preco_total": 14.99
    }
  ]
}

⚠️ REGRAS ABSOLUTAS PARA EXTRAÇÃO DE ITENS:

1. LEIA LINHA POR LINHA a área central do cupom
2. EXTRAIA TODO produto que tem preço associado
3. Se não conseguir ler quantidade exata, use 1.0
4. Se não conseguir ler preço unitário, use o preço total
5. NUNCA retorne array de itens vazio se há produtos visíveis
6. Inclua TODAS as linhas que parecem ser produtos

🎯 EXEMPLO PRÁTICO:

Cupom mostra:
SUPERMERCADO XYZ
CNPJ: 12.345.678/0001-90
--------------------------
001 ARROZ BRANCO 5KG
    2.000 x 18.90 = 37.80
002 FEIJAO PRETO 1KG  
    3.000 x 7.50 = 22.50
003 OLEO SOJA 900ML
    1.000 x 8.90 = 8.90
--------------------------
TOTAL R$ 69.20

Extração esperada (JSON):
{
  "fornecedor": "SUPERMERCADO XYZ",
  "cnpj": "12.345.678/0001-90",
  "data": "2025-11-19",
  "total": 69.20,
  "itens": [
    {"nome": "ARROZ BRANCO 5KG", "quantidade": 2.0, "preco_unitario": 18.90, "preco_total": 37.80},
    {"nome": "FEIJAO PRETO 1KG", "quantidade": 3.0, "preco_unitario": 7.50, "preco_total": 22.50},
    {"nome": "OLEO SOJA 900ML", "quantidade": 1.0, "preco_unitario": 8.90, "preco_total": 8.90}
  ]
}

✅ CHECKLIST ANTES DE RETORNAR:
□ Encontrei o nome do estabelecimento?
□ Encontrei a data da compra?
□ Encontrei o valor total?
□ LI TODAS AS LINHAS entre cabeçalho e total?
□ Extraí CADA produto visível?
□ O array "itens" tem pelo menos 1 produto?

❌ ERROS COMUNS A EVITAR:
- Retornar itens: [] vazio quando há produtos no cupom
- Pular linhas de produtos
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
        model: 'gemini-2.0-flash-exp',
        messages,
        max_tokens: 4000,
        temperature: 0.1,
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
