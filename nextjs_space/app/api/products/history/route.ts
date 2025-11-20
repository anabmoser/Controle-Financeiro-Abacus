
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/products/history?productName=ARROZ&limit=50
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productName = searchParams.get('productName')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!productName) {
      return NextResponse.json({ error: 'productName é obrigatório' }, { status: 400 })
    }

    // Buscar histórico de compras do produto
    const history = await prisma.purchaseItem.findMany({
      where: {
        productName: {
          contains: productName,
          mode: 'insensitive',
        },
      },
      include: {
        purchase: {
          select: {
            id: true,
            supplierName: true,
            supplierCnpj: true,
            purchaseDate: true,
            totalAmount: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        purchase: {
          purchaseDate: 'desc',
        },
      },
      take: limit,
    })

    // Calcular estatísticas
    const stats = {
      totalCompras: history.length,
      quantidadeTotal: history.reduce((sum, item) => sum + Number(item.quantity), 0),
      valorTotal: history.reduce((sum, item) => sum + Number(item.totalPrice), 0),
      precoMedio: history.length > 0
        ? history.reduce((sum, item) => sum + Number(item.unitPrice), 0) / history.length
        : 0,
      precoMinimo: history.length > 0
        ? Math.min(...history.map((item) => Number(item.unitPrice)))
        : 0,
      precoMaximo: history.length > 0
        ? Math.max(...history.map((item) => Number(item.unitPrice)))
        : 0,
      fornecedores: [...new Set(history.map((item) => item.purchase.supplierName))],
    }

    // Agrupar por fornecedor
    const porFornecedor = history.reduce((acc, item) => {
      const supplier = item.purchase.supplierName
      if (!acc[supplier]) {
        acc[supplier] = {
          nome: supplier,
          cnpj: item.purchase.supplierCnpj,
          compras: 0,
          quantidadeTotal: 0,
          valorTotal: 0,
          precoMedio: 0,
          ultimaCompra: item.purchase.purchaseDate,
        }
      }
      acc[supplier].compras++
      acc[supplier].quantidadeTotal += Number(item.quantity)
      acc[supplier].valorTotal += Number(item.totalPrice)
      acc[supplier].precoMedio =
        acc[supplier].valorTotal / acc[supplier].quantidadeTotal
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      productName,
      stats,
      history: history.map((item) => ({
        id: item.id,
        produto: item.productName, // Nome do produto
        data: item.purchase.purchaseDate,
        fornecedor: item.purchase.supplierName,
        cnpj: item.purchase.supplierCnpj,
        quantidade: Number(item.quantity),
        unidade: item.unit,
        precoUnitario: Number(item.unitPrice),
        precoTotal: Number(item.totalPrice),
        desconto: Number(item.discountAmount),
        categoria: item.category?.name || 'Sem categoria',
        purchaseId: item.purchase.id,
      })),
      porFornecedor: Object.values(porFornecedor),
    })
  } catch (error) {
    console.error('Erro ao buscar histórico do produto:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar histórico do produto' },
      { status: 500 }
    )
  }
}
