
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { downloadFile } from '@/lib/s3'

export const dynamic = 'force-dynamic'

// Função para processar documento com LLM (substitui Azure OCR)
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
    
    const promptText = `Extraia todas as informações deste cupom fiscal ou nota. 

Retorne um JSON válido com a seguinte estrutura exata:
{
  "fornecedor": "nome do estabelecimento",
  "cnpj": "CNPJ se disponível ou null",
  "data": "data da compra no formato YYYY-MM-DD",
  "total": 123.45,
  "itens": [
    {
      "nome": "nome do produto",
      "quantidade": 1.0,
      "preco_unitario": 10.50,
      "preco_total": 10.50
    }
  ]
}

IMPORTANTE:
- Retorne APENAS o JSON, sem texto adicional
- Valores numéricos devem ser números, não strings
- Se não encontrar um valor, use null
- Data deve estar no formato YYYY-MM-DD`

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
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 2000,
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
    const result = {
      supplierName: extractedData?.supplier_name || extractedData?.fornecedor || extractedData?.supplier || 'Fornecedor Desconhecido',
      supplierCnpj: extractedData?.cnpj || extractedData?.supplier_cnpj || null,
      purchaseDate: extractedData?.date || extractedData?.data || extractedData?.purchase_date || new Date().toISOString(),
      totalAmount: parseFloat(extractedData?.total || extractedData?.total_amount || extractedData?.valor_total || 0),
      items: (extractedData?.items || extractedData?.itens || extractedData?.produtos || []).map((item: any) => ({
        name: item?.name || item?.produto || item?.description || item?.nome || 'Item',
        quantity: parseFloat(item?.quantity || item?.quantidade || item?.qtd || 1),
        unitPrice: parseFloat(item?.unit_price || item?.preco_unitario || item?.valor_unitario || 0),
        totalPrice: parseFloat(item?.total_price || item?.preco_total || item?.valor_total || 0),
      })),
    }

    console.log('Dados estruturados:', JSON.stringify(result, null, 2))
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
