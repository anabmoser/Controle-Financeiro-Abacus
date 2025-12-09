require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBills() {
  try {
    const bills = await prisma.bill.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('\n=== ÚLTIMOS 5 BOLETOS NO BANCO ===\n');
    bills.forEach((bill, idx) => {
      console.log(`\n[${idx + 1}] ID: ${bill.id}`);
      console.log(`    Fornecedor: ${bill.supplierName}`);
      console.log(`    Valor: R$ ${bill.totalAmount}`);
      console.log(`    Vencimento: ${bill.dueDate}`);
      console.log(`    Status OCR: ${bill.ocrStatus}`);
      console.log(`    Erro OCR: ${bill.ocrError || 'N/A'}`);
      console.log(`    Arquivo: ${bill.fileName}`);
      console.log(`    S3 Key: ${bill.fileUrl}`);
    });
    
  } catch (error) {
    console.error('Erro ao verificar boletos:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBills();
