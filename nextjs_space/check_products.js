const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Verificando produtos no banco ===\n');
  
  // Contar total de purchaseItems
  const totalItems = await prisma.purchaseItem.count();
  console.log(`Total de items de compra: ${totalItems}\n`);
  
  if (totalItems > 0) {
    // Buscar alguns exemplos
    const sampleItems = await prisma.purchaseItem.findMany({
      take: 10,
      select: {
        id: true,
        productName: true,
        productCode: true,
        quantity: true,
        unitPrice: true,
      },
    });
    
    console.log('Exemplos de produtos:');
    sampleItems.forEach((item, idx) => {
      console.log(`${idx + 1}. Nome: "${item.productName}" | Código: "${item.productCode}"`);
    });
    
    console.log('\n=== Testando busca por "queijo" ===\n');
    
    // Testar busca por "queijo"
    const queijoItems = await prisma.purchaseItem.findMany({
      where: {
        productName: {
          contains: 'queijo',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        productName: true,
        productCode: true,
      },
      take: 5,
    });
    
    console.log(`Encontrados: ${queijoItems.length} items com "queijo"`);
    queijoItems.forEach((item, idx) => {
      console.log(`${idx + 1}. "${item.productName}" (${item.productCode})`);
    });
  }
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
