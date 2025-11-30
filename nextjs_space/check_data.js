const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // Verificar compras
    const purchases = await prisma.purchase.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        purchaseItems: true
      }
    });
    
    console.log('\n📦 COMPRAS ENCONTRADAS:', purchases.length);
    
    if (purchases.length > 0) {
      console.log('\n🔍 ÚLTIMA COMPRA:');
      console.log(JSON.stringify(purchases[0], null, 2));
    } else {
      console.log('\n⚠️ NENHUMA COMPRA ENCONTRADA NO BANCO!');
    }
    
    // Verificar produtos
    const products = await prisma.product.count();
    console.log('\n📦 PRODUTOS CADASTRADOS:', products);
    
    // Verificar categorias
    const categories = await prisma.category.count();
    console.log('📁 CATEGORIAS:', categories);
    
    // Verificar receipts
    const receipts = await prisma.receipt.findMany({
      take: 5,
      orderBy: { created_at: 'desc' }
    });
    console.log('\n📄 RECEIPTS:', receipts.length);
    
    if (receipts.length > 0) {
      console.log('\n🔍 ÚLTIMO RECEIPT:');
      console.log(JSON.stringify(receipts[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
