
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeProductName } from '@/lib/formatters'
import { categorizeProduct } from '@/lib/categorization'

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

    // Buscar todas as categorias disponíveis para categorização automática
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
    })

    console.log(`🤖 Auto-categorização: ${categories.length} categorias disponíveis`)

    // Criar a compra
    const purchase = await prisma.purchase.create({
      data: {
        supplierName: ocrData?.supplierName || 'Fornecedor Desconhecido',
        supplierCnpj: ocrData?.supplierCnpj,
        // Força data para timezone brasileiro (UTC-3) para evitar conversão incorreta
        purchaseDate: ocrData?.purchaseDate 
          ? new Date(ocrData.purchaseDate + 'T12:00:00-03:00') 
          : new Date(new Date().toISOString().split('T')[0] + 'T12:00:00-03:00'),
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

    // Criar itens da compra com categorização automática
    if (ocrData?.items && Array.isArray(ocrData.items)) {
      for (const item of ocrData.items) {
        const productName = item?.name || 'Produto'
        const normalizedName = normalizeProductName(productName)
        
        // Buscar produto existente
        let product = await prisma.product.findFirst({
          where: { normalizedName },
        })

        let categoryId: string | null = null

        if (!product) {
          // 🤖 CATEGORIZAÇÃO AUTOMÁTICA via IA
          if (categories.length > 0) {
            const categorizationResult = await categorizeProduct(productName, categories)
            categoryId = categorizationResult.categoryId
            
            if (categoryId) {
              console.log(`✅ "${productName}" → ${categorizationResult.categoryName} (${(categorizationResult.confidence * 100).toFixed(0)}%)`)
            } else {
              console.log(`⚠️  "${productName}" → Sem categoria (IA não conseguiu categorizar)`)
            }
          }

          // Criar novo produto com categoria
          product = await prisma.product.create({
            data: {
              name: productName,
              normalizedName,
              unit: 'un',
              categoryId: categoryId,
            },
          })
        } else {
          // Produto já existe, usar a categoria dele
          categoryId = product.categoryId
        }

        // Criar item da compra com categoria
        await prisma.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: product.id,
            productName: productName,
            quantity: item?.quantity || 1,
            unitPrice: item?.unitPrice || 0,
            totalPrice: item?.totalPrice || 0,
            categoryId: categoryId,
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
