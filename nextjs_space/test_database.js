require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n✅ Testando conexão com banco de dados...');
    
    // Teste simples de query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('Resultado do teste:', result);
    
    // Testar contagem de boletos
    const billCount = await prisma.bill.count();
    console.log(`\n📊 Total de boletos no banco: ${billCount}`);
    
    // Testar contagem de categorias
    const categoryCount = await prisma.category.count();
    console.log(`📊 Total de categorias no banco: ${categoryCount}`);
    
  } catch (error) {
    console.error('\n❌ Erro ao conectar ao banco:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
