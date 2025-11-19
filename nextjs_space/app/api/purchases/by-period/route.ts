
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/purchases/by-period?startDate=2025-01-01&endDate=2025-12-31&supplier=ATACADAO
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const supplier = searchParams.get('supplier')
    const category = searchParams.get('category')
    const productName = searchParams.get('productName')

    const whereClause: any = {}

    // Filtro de data
    if (startDate || endDate) {
      whereClause.purchaseDate = {}
      if (startDate) whereClause.purchaseDate.gte = new Date(startDate)
      if (endDate) whereClause.purchaseDate.lte = new Date(endDate)
    }

    // Filtro de fornecedor
    if (supplier) {
      whereClause.supplierName = {
        contains: supplier,
        mode: 'insensitive',
      }
    }

    // Buscar compras
    const purchases = await prisma.purchase.findMany({
      where: whereClause,
      include: {
        purchaseItems: {
          where: {
            AND: [
              category ? { category: { name: { contains: category, mode: 'insensitive' } } } : {},
              productName ? { productName: { contains: productName, mode: 'insensitive' } } : {},
            ],
          },
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    })

    // Agregar dados
    const allItems = purchases.flatMap((p) =>
      p.purchaseItems.map((item) => ({
        ...item,
        purchaseDate: p.purchaseDate,
        supplierName: p.supplierName,
        supplierCnpj: p.supplierCnpj,
      }))
    )

    // Estatísticas gerais
    const stats = {
      totalCompras: purchases.length,
      totalItens: allItems.length,
      valorTotal: purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0),
      quantidadeTotal: allItems.reduce((sum, item) => sum + Number(item.quantity), 0),
      fornecedores: [...new Set(purchases.map((p) => p.supplierName))].length,
    }

    // Agrupar por produto
    const porProduto = allItems.reduce((acc, item) => {
      const key = item.productName
      if (!acc[key]) {
        acc[key] = {
          nome: item.productName,
          categoria: item.category?.name || 'Sem categoria',
          compras: 0,
          quantidadeTotal: 0,
          valorTotal: 0,
          precoMedio: 0,
          fornecedores: new Set(),
        }
      }
      acc[key].compras++
      acc[key].quantidadeTotal += Number(item.quantity)
      acc[key].valorTotal += Number(item.totalPrice)
      acc[key].fornecedores.add(item.supplierName)
      return acc
    }, {} as Record<string, any>)

    // Calcular preço médio e converter Set para array
    Object.values(porProduto).forEach((prod: any) => {
      prod.precoMedio = prod.valorTotal / prod.quantidadeTotal
      prod.fornecedores = Array.from(prod.fornecedores)
    })

    // Agrupar por fornecedor
    const porFornecedor = purchases.reduce((acc, purchase) => {
      const key = purchase.supplierName
      if (!acc[key]) {
        acc[key] = {
          nome: purchase.supplierName,
          cnpj: purchase.supplierCnpj,
          compras: 0,
          valorTotal: 0,
          itensTotal: 0,
        }
      }
      acc[key].compras++
      acc[key].valorTotal += Number(purchase.totalAmount)
      acc[key].itensTotal += purchase.purchaseItems.length
      return acc
    }, {} as Record<string, any>)

    // Agrupar por categoria
    const porCategoria = allItems.reduce((acc, item) => {
      const key = item.category?.name || 'Sem categoria'
      if (!acc[key]) {
        acc[key] = {
          nome: key,
          cor: item.category?.color || '#gray',
          itens: 0,
          valorTotal: 0,
        }
      }
      acc[key].itens++
      acc[key].valorTotal += Number(item.totalPrice)
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      periodo: {
        inicio: startDate || 'Início',
        fim: endDate || 'Hoje',
      },
      stats,
      compras: purchases.map((p) => ({
        id: p.id,
        data: p.purchaseDate,
        fornecedor: p.supplierName,
        cnpj: p.supplierCnpj,
        total: Number(p.totalAmount),
        itens: p.purchaseItems.length,
        items: p.purchaseItems.map((item) => ({
          nome: item.productName,
          quantidade: Number(item.quantity),
          unidade: item.unit,
          precoUnitario: Number(item.unitPrice),
          precoTotal: Number(item.totalPrice),
          categoria: item.category?.name || 'Sem categoria',
        })),
      })),
      porProduto: Object.values(porProduto).sort(
        (a: any, b: any) => b.valorTotal - a.valorTotal
      ),
      porFornecedor: Object.values(porFornecedor).sort(
        (a: any, b: any) => b.valorTotal - a.valorTotal
      ),
      porCategoria: Object.values(porCategoria).sort(
        (a: any, b: any) => b.valorTotal - a.valorTotal
      ),
    })
  } catch (error) {
    console.error('Erro ao buscar compras por período:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar compras por período' },
      { status: 500 }
    )
  }
}
