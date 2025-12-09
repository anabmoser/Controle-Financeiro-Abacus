require('dotenv').config();

async function testAPI() {
  const apiKey = process.env.ABACUSAI_API_KEY;
  
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NÃO ENCONTRADA');
  
  try {
    console.log('\nTestando conexão com API...');
    
    const response = await fetch('https://apis.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Olá, responda apenas "OK" se você está funcionando.'
          }
        ],
        temperature: 0.0,
        max_tokens: 10
      })
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('\nResposta:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAPI();
