
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear, subWeeks, subMonths, subYears } from 'date-fns'

export const dynamic = 'force-dynamic'

// GET /api/reports/summary?type=week|month|year&compare=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'month' // week, month, year
    const compare = searchParams.get('compare') === 'true'

    const now = new Date()
    let currentStart: Date
    let currentEnd: Date
    let previousStart: Date
    let previousEnd: Date

    // Definir períodos
    switch (type) {
      case 'week':
        currentStart = startOfWeek(now, { weekStartsOn: 0 })
        currentEnd = endOfWeek(now, { weekStartsOn: 0 })
        previousStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 })
        previousEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 })
        break
      case 'year':
        currentStart = startOfYear(now)
        currentEnd = endOfYear(now)
        previousStart = startOfYear(subYears(now, 1))
        previousEnd = endOfYear(subYears(now, 1))
        break
      case 'month':
      default:
        currentStart = startOfMonth(now)
        currentEnd = endOfMonth(now)
        previousStart = startOfMonth(subMonths(now, 1))
        previousEnd = endOfMonth(subMonths(now, 1))
        break
    }

    // Buscar dados do período atual
    const currentPurchases = await prisma.purchase.findMany({
      where: {
        purchaseDate: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
      include: {
        purchaseItems: {
          include: {
            category: true,
          },
        },
      },
    })

    // Buscar dados do período anterior (se comparação ativada)
    let previousPurchases: typeof currentPurchases = []
    if (compare) {
      previousPurchases = await prisma.purchase.findMany({
        where: {
          purchaseDate: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
        include: {
          purchaseItems: {
            include: {
              category: true,
            },
          },
        },
      })
    }

    // Função auxiliar para agregar dados
    const aggregateData = (purchases: typeof currentPurchases) => {
      const totalCompras = purchases.length
      const totalValor = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0)
      const allItems = purchases.flatMap((p) => p.purchaseItems)
      const totalItens = allItems.length
      const totalQuantidade = allItems.reduce((sum, item) => sum + Number(item.quantity), 0)

      // Top 10 produtos mais comprados
      const produtosMap = allItems.reduce((acc, item) => {
        const key = item.productName
        if (!acc[key]) {
          acc[key] = {
            nome: item.productName,
            quantidade: 0,
            valorTotal: 0,
            compras: 0,
          }
        }
        acc[key].quantidade += Number(item.quantity)
        acc[key].valorTotal += Number(item.totalPrice)
        acc[key].compras++
        return acc
      }, {} as Record<string, any>)

      const topProdutos = Object.values(produtosMap)
        .sort((a: any, b: any) => b.valorTotal - a.valorTotal)
        .slice(0, 10)

      // Top fornecedores
      const fornecedoresMap = purchases.reduce((acc, p) => {
        const key = p.supplierName
        if (!acc[key]) {
          acc[key] = {
            nome: p.supplierName,
            cnpj: p.supplierCnpj,
            compras: 0,
            valorTotal: 0,
          }
        }
        acc[key].compras++
        acc[key].valorTotal += Number(p.totalAmount)
        return acc
      }, {} as Record<string, any>)

      const topFornecedores = Object.values(fornecedoresMap)
        .sort((a: any, b: any) => b.valorTotal - a.valorTotal)
        .slice(0, 10)

      // Por categoria
      const categoriasMap = allItems.reduce((acc, item) => {
        const key = item.category?.name || 'Sem categoria'
        if (!acc[key]) {
          acc[key] = {
            nome: key,
            cor: item.category?.color || '#gray',
            valorTotal: 0,
            itens: 0,
          }
        }
        acc[key].valorTotal += Number(item.totalPrice)
        acc[key].itens++
        return acc
      }, {} as Record<string, any>)

      const porCategoria = Object.values(categoriasMap).sort(
        (a: any, b: any) => b.valorTotal - a.valorTotal
      )

      return {
        totalCompras,
        totalValor,
        totalItens,
        totalQuantidade,
        ticketMedio: totalCompras > 0 ? totalValor / totalCompras : 0,
        topProdutos,
        topFornecedores,
        porCategoria,
      }
    }

    const currentData = aggregateData(currentPurchases)
    const previousData = compare ? aggregateData(previousPurchases) : null

    // Calcular variações
    const calcVariation = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const comparacao = compare && previousData
      ? {
          compras: {
            atual: currentData.totalCompras,
            anterior: previousData.totalCompras,
            variacao: calcVariation(currentData.totalCompras, previousData.totalCompras),
          },
          valor: {
            atual: currentData.totalValor,
            anterior: previousData.totalValor,
            variacao: calcVariation(currentData.totalValor, previousData.totalValor),
          },
          ticketMedio: {
            atual: currentData.ticketMedio,
            anterior: previousData.ticketMedio,
            variacao: calcVariation(currentData.ticketMedio, previousData.ticketMedio),
          },
        }
      : null

    return NextResponse.json({
      tipo: type,
      periodo: {
        atual: {
          inicio: currentStart,
          fim: currentEnd,
        },
        anterior: compare
          ? {
              inicio: previousStart,
              fim: previousEnd,
            }
          : null,
      },
      dados: currentData,
      comparacao,
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
  }
}
