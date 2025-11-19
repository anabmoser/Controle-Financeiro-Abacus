
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
    
    const messages = [
      {
        role: 'user',
        content: isImage
          ? [
              {
                type: 'text',
                text: 'Extraia todas as informações deste cupom fiscal. Liste: nome do fornecedor, CNPJ (se houver), data, total, e todos os itens com nome, quantidade e preço. Retorne em formato JSON estruturado.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${fileType};base64,${base64}`,
                },
              },
            ]
          : `Extraia todas as informações deste documento PDF. Liste: nome do fornecedor, CNPJ (se houver), data, total, e todos os itens com nome, quantidade e preço. Retorne em formato JSON estruturado. Conteúdo base64 do documento: ${base64.substring(0, 100)}...`,
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
        model: 'gpt-4.1-mini',
        messages,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!llmResponse.ok) {
      throw new Error('Erro na chamada da API LLM')
    }

    const llmData = await llmResponse.json()
    const content = llmData?.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('Resposta vazia da LLM')
    }

    // Parse JSON response
    const extractedData = JSON.parse(content)

    // Estruturar dados no formato esperado
    return {
      supplierName: extractedData?.supplier_name || extractedData?.fornecedor || 'Fornecedor Desconhecido',
      supplierCnpj: extractedData?.cnpj || null,
      purchaseDate: extractedData?.date || extractedData?.data || new Date().toISOString(),
      totalAmount: extractedData?.total || extractedData?.total_amount || 0,
      items: (extractedData?.items || extractedData?.itens || []).map((item: any) => ({
        name: item?.name || item?.produto || item?.description || 'Item',
        quantity: item?.quantity || item?.quantidade || 1,
        unitPrice: item?.unit_price || item?.preco_unitario || 0,
        totalPrice: item?.total_price || item?.preco_total || 0,
      })),
    }
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
