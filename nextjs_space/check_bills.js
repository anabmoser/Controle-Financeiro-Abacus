const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkBills() {
  try {
    const bills = await prisma.bill.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('\n📋 BOLETOS RECENTES:\n');
    bills.forEach((bill, index) => {
      console.log(`${index + 1}. ID: ${bill.id}`);
      console.log(`   Fornecedor: ${bill.supplierName}`);
      console.log(`   Valor: R$ ${bill.totalAmount.toFixed(2)}`);
      console.log(`   Status OCR: ${bill.ocrStatus}`);
      console.log(`   Erro: ${bill.ocrError || 'Nenhum'}`);
      console.log(`   Tamanho: ${bill.fileSize ? Number(bill.fileSize) : 0} bytes`);
      console.log(`   Tipo: ${bill.fileType}`);
      console.log(`   Arquivo: ${bill.fileUrl}`);
      console.log('');
    });
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBills();
