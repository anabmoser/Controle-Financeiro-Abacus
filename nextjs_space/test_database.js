// Script para verificar o banco de dados Supabase
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabase() {
  console.log('\n=== VERIFICANDO BANCO DE DADOS SUPABASE ===\n');

  try {
    // 1. Verificar Bills
    console.log('1. Tabela Bills:');
    const bills = await prisma.bill.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`   Total de boletos: ${bills.length}`);
    if (bills.length > 0) {
      console.log('   Últimos boletos:');
      bills.forEach(bill => {
        console.log(`   - ${bill.supplierName} | Vencimento: ${bill.dueDate} | R$ ${bill.amount} | Status: ${bill.status}`);
      });
    } else {
      console.log('   ⚠️  Nenhum boleto cadastrado ainda');
    }

    // 2. Verificar Purchases
    console.log('\n2. Tabela Purchases:');
    const purchases = await prisma.purchase.findMany({
      take: 5,
      orderBy: { purchaseDate: 'desc' }
    });
    console.log(`   Total de compras: ${purchases.length}`);
    if (purchases.length > 0) {
      console.log('   Últimas compras:');
      purchases.forEach(purchase => {
        console.log(`   - ${purchase.supplierName} | ${purchase.purchaseDate} | R$ ${purchase.totalAmount}`);
      });
    }

    // 3. Verificar Products
    console.log('\n3. Tabela Products:');
    const products = await prisma.product.findMany({
      take: 5,
      include: { category: true }
    });
    console.log(`   Total de produtos: ${products.length}`);
    if (products.length > 0) {
      console.log('   Alguns produtos:');
      products.forEach(product => {
        console.log(`   - ${product.name} | Categoria: ${product.category?.name || 'Sem categoria'}`);
      });
    }

    // 4. Verificar Categories
    console.log('\n4. Tabela Categories:');
    const categories = await prisma.category.findMany();
    console.log(`   Total de categorias: ${categories.length}`);
    if (categories.length > 0) {
      console.log('   Categorias cadastradas:');
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.color})`);
      });
    } else {
      console.log('   ⚠️  Nenhuma categoria cadastrada');
    }

    // 5. Testar conexão
    console.log('\n5. Teste de Conexão:');
    await prisma.$queryRaw`SELECT NOW()`;
    console.log('   ✅ Conexão com Supabase OK!');

    // 6. Estatísticas gerais
    console.log('\n=== ESTATÍSTICAS GERAIS ===');
    const stats = {
      bills: await prisma.bill.count(),
      purchases: await prisma.purchase.count(),
      products: await prisma.product.count(),
      categories: await prisma.category.count(),
      receipts: await prisma.receipt.count()
    };
    console.log(`   Boletos: ${stats.bills}`);
    console.log(`   Compras: ${stats.purchases}`);
    console.log(`   Produtos: ${stats.products}`);
    console.log(`   Categorias: ${stats.categories}`);
    console.log(`   Recibos: ${stats.receipts}`);

  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
