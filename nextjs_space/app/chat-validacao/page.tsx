
'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Send, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function ChatValidacaoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const receiptId = searchParams?.get('receiptId')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [ocrData, setOcrData] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (receiptId) {
      loadOcrData()
    }
  }, [receiptId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadOcrData() {
    try {
      const response = await fetch(`/api/ocr/result?receiptId=${receiptId}`)
      const data = await response.json()
      setOcrData(data)

      // Iniciar conversa com IA
      await startChat(data)
    } catch (error) {
      console.error('Erro ao carregar dados OCR:', error)
      toast.error('Erro ao carregar dados do documento')
    } finally {
      setInitialLoading(false)
    }
  }

  async function startChat(data: any) {
    try {
      const response = await fetch('/api/chat/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrData: data,
          action: 'start',
        }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiMessage = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                break
              }
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  aiMessage += parsed.content
                  setMessages([
                    { role: 'assistant', content: aiMessage },
                  ])
                }
              } catch (e) {
                // Ignorar erros de parsing
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao iniciar chat:', error)
      toast.error('Erro ao iniciar validação')
    }
  }

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          ocrData,
          action: 'continue',
        }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiMessage = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                break
              }
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  aiMessage += parsed.content
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    const lastMessage = newMessages[newMessages.length - 1]
                    if (lastMessage?.role === 'assistant') {
                      lastMessage.content = aiMessage
                    } else {
                      newMessages.push({
                        role: 'assistant',
                        content: aiMessage,
                      })
                    }
                    return newMessages
                  })
                }
              } catch (e) {
                // Ignorar erros de parsing
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao processar mensagem')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmAndSave() {
    try {
      const response = await fetch('/api/purchases/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId,
          ocrData,
          messages,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar compra')
      }

      const data = await response.json()
      toast.success('Compra salva com sucesso!')
      router.push('/compras')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar compra')
    }
  }

  if (initialLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Validação com IA
        </h1>

        {/* Chat Container */}
        <div className="card h-[600px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4 space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Digite sua mensagem..."
                className="input flex-1"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="btn btn-primary"
              >
                {loading ? <LoadingSpinner size="sm" /> : <Send className="h-5 w-5" />}
              </button>
            </div>

            <button
              onClick={handleConfirmAndSave}
              className="btn btn-success w-full"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Confirmar e Salvar Compra
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function ChatValidacaoPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ChatValidacaoContent />
    </Suspense>
  )
}
