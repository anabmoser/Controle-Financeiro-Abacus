
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeProductName } from '@/lib/formatters'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { receiptId, ocrData, messages } = body

    if (!receiptId || !ocrData) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Criar a compra
    const purchase = await prisma.purchase.create({
      data: {
        supplierName: ocrData?.supplierName || 'Fornecedor Desconhecido',
        supplierCnpj: ocrData?.supplierCnpj,
        purchaseDate: new Date(ocrData?.purchaseDate || Date.now()),
        totalAmount: ocrData?.totalAmount || 0,
        paymentMethod: ocrData?.paymentMethod,
        status: 'completed',
      },
    })

    // Associar receipt à compra
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { purchaseId: purchase.id },
    })

    // Criar itens da compra
    if (ocrData?.items && Array.isArray(ocrData.items)) {
      for (const item of ocrData.items) {
        // Buscar ou criar produto
        const normalizedName = normalizeProductName(item?.name || '')
        let product = await prisma.product.findFirst({
          where: { normalizedName },
        })

        if (!product) {
          // Criar novo produto
          product = await prisma.product.create({
            data: {
              name: item?.name || 'Produto',
              normalizedName,
              unit: 'un',
            },
          })
        }

        // Criar item da compra
        await prisma.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: product.id,
            productName: item?.name || 'Produto',
            quantity: item?.quantity || 1,
            unitPrice: item?.unitPrice || 0,
            totalPrice: item?.totalPrice || 0,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      purchaseId: purchase.id,
    })
  } catch (error) {
    console.error('Erro ao salvar compra:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar compra' },
      { status: 500 }
    )
  }
}
