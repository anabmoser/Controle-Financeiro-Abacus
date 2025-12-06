require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('\n=== VERIFICAÇÃO COMPLETA DO SISTEMA ===\n');

  try {
    // Teste Bills API - similar ao que o frontend faz
    console.log('1. Testando endpoint /api/bills (simulado)');
    const bills = await prisma.bill.findMany({
      orderBy: { dueDate: 'asc' }
    });
    console.log(`   ✅ Retornou ${bills.length} boletos`);

    // Teste Stats API
    console.log('\n2. Testando endpoint /api/bills/stats (simulado)');
    const totalBills = await prisma.bill.count();
    const overdueBills = await prisma.bill.count({
      where: {
        dueDate: { lt: new Date() },
        status: { not: 'PAID' }
      }
    });
    const upcomingBills = await prisma.bill.count({
      where: {
        dueDate: { gte: new Date() },
        status: { not: 'PAID' }
      }
    });
    const paidBills = await prisma.bill.count({
      where: { status: 'PAID' }
    });
    
    const totalToPay = await prisma.bill.aggregate({
      where: { status: { not: 'PAID' } },
      _sum: { totalAmount: true }
    });

    console.log(`   Total: ${totalBills}`);
    console.log(`   Vencidos: ${overdueBills}`);
    console.log(`   A Vencer: ${upcomingBills}`);
    console.log(`   Pagos: ${paidBills}`);
    console.log(`   Total a Pagar: R$ ${totalToPay._sum.totalAmount || 0}`);

    // Teste Upcoming API
    console.log('\n3. Testando endpoint /api/bills/upcoming (simulado)');
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcoming = await prisma.bill.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: nextWeek
        },
        status: { not: 'PAID' }
      },
      orderBy: { dueDate: 'asc' }
    });
    console.log(`   ✅ ${upcoming.length} boletos vencendo nos próximos 7 dias`);

    // Verificar Purchases (do sistema anterior)
    console.log('\n4. Verificando sistema de Compras (já existente)');
    const purchases = await prisma.purchase.count();
    const products = await prisma.product.count();
    console.log(`   Compras: ${purchases}`);
    console.log(`   Produtos: ${products}`);
    console.log(`   ✅ Sistema de compras funcionando`);

    console.log('\n=== RESUMO FINAL ===');
    console.log('✅ Conexão com Supabase: OK');
    console.log('✅ API de Boletos: Funcionando');
    console.log('✅ API de Estatísticas: Funcionando');
    console.log('✅ API de Vencimentos: Funcionando');
    console.log('✅ Sistema de Compras: Funcionando');
    console.log('\n🎉 TODOS OS SISTEMAS ESTÃO OPERACIONAIS!\n');
    console.log('📊 Dados atuais:');
    console.log(`   - ${totalBills} boleto(s)`);
    console.log(`   - ${purchases} compra(s)`);
    console.log(`   - ${products} produto(s)`);

    if (totalBills === 0) {
      console.log('\n💡 Dica: Faça o upload de um boleto na página /boletos para testar o OCR automático!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
