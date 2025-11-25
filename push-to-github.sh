#!/bin/bash

echo "======================================"
echo "🚀 Push para GitHub"
echo "======================================"
echo ""
echo "Repositório: https://github.com/anabmoser/Controle-Financeiro-Abacus"
echo ""

# Verificar se estamos no diretório correto
if [ ! -d ".git" ]; then
    echo "❌ Erro: Este script deve ser executado no diretório raiz do projeto"
    exit 1
fi

echo "📊 Status atual:"
git log --oneline -1
echo ""

echo "Escolha o método de autenticação:"
echo ""
echo "1) HTTPS com Personal Access Token"
echo "2) SSH (requer configuração prévia)"
echo "3) Cancelar"
echo ""
read -p "Digite sua escolha (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📝 Para usar HTTPS, você precisa de um Personal Access Token."
        echo "   Veja instruções em: GITHUB_PUSH_GUIDE.md"
        echo ""
        read -p "Você já tem um Personal Access Token? (s/n): " has_token
        
        if [ "$has_token" = "s" ] || [ "$has_token" = "S" ]; then
            echo ""
            echo "Cole seu token (será ocultado):"
            read -s token
            echo ""
            
            if [ -z "$token" ]; then
                echo "❌ Token vazio. Operação cancelada."
                exit 1
            fi
            
            echo "🚀 Fazendo push..."
            git push https://$token@github.com/anabmoser/Controle-Financeiro-Abacus.git main
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "✅ Push realizado com sucesso!"
                echo "🎉 Seu código está agora no GitHub!"
                echo ""
                echo "Acesse: https://github.com/anabmoser/Controle-Financeiro-Abacus"
            else
                echo ""
                echo "❌ Erro no push. Verifique:"
                echo "   - Token está correto?"
                echo "   - Token tem permissão 'repo'?"
                echo "   - Repositório existe?"
            fi
        else
            echo ""
            echo "📖 Siga as instruções em GITHUB_PUSH_GUIDE.md para criar um token"
            echo "   URL: https://github.com/settings/tokens"
        fi
        ;;
    
    2)
        echo ""
        echo "🔐 Usando SSH..."
        git remote set-url origin git@github.com:anabmoser/Controle-Financeiro-Abacus.git
        git push -u origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Push realizado com sucesso!"
            echo "🎉 Seu código está agora no GitHub!"
        else
            echo ""
            echo "❌ Erro no push SSH. Verifique:"
            echo "   - Chave SSH está configurada no GitHub?"
            echo "   - Execute: ssh -T git@github.com para testar"
            echo ""
            echo "📖 Veja GITHUB_PUSH_GUIDE.md para configurar SSH"
        fi
        ;;
    
    3)
        echo ""
        echo "❌ Operação cancelada."
        exit 0
        ;;
    
    *)
        echo ""
        echo "❌ Opção inválida."
        exit 1
        ;;
esac
