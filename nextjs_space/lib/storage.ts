/**
 * Supabase Storage - módulo de armazenamento
 * Substitui lib/s3.ts para migração para Vercel/Supabase
 */

import { createClient } from '@supabase/supabase-js'

const BUCKET = 'receipts'

// Cliente Supabase com service role key (server-side only)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase env vars not configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Sanitiza um caminho de arquivo para uso como key no storage.
 * Regra determinística: normalize NFD, remove diacríticos, troca caracteres
 * fora de [A-Za-z0-9._/-] por _
 */
export function sanitizeKey(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._/-]/g, '_')
}

/**
 * Converte um caminho legado do banco de dados (ex: "11526/receipts/arquivo.pdf")
 * para o caminho correspondente no Supabase Storage.
 * Remove o prefixo da pasta Abacus ("11526/") e aplica sanitizeKey.
 */
export function legacyPathToStoragePath(dbPath: string): string {
  // Remove prefixo "11526/" se presente
  let cleaned = dbPath
  const abacusPrefixMatch = cleaned.match(/^\d+\//)
  if (abacusPrefixMatch) {
    cleaned = cleaned.substring(abacusPrefixMatch[0].length)
  }
  return sanitizeKey(cleaned)
}

/**
 * Upload de arquivo para o Supabase Storage.
 * Novos uploads já gravam o caminho sanitizado.
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  isPublic: boolean = false
): Promise<string> {
  const supabase = getSupabaseAdmin()
  const sanitized = sanitizeKey(fileName)
  const key = `receipts/${Date.now()}-${sanitized}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, {
      contentType: 'application/octet-stream',
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
  return key
}

/**
 * Upload de boleto para o Supabase Storage.
 */
export async function uploadBillFile(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const supabase = getSupabaseAdmin()
  const sanitized = sanitizeKey(fileName)
  const key = `bills/${Date.now()}-${sanitized}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, {
      contentType: 'application/octet-stream',
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
  return key
}

/**
 * Gera uma URL assinada (1h) para download de um arquivo.
 * Aceita tanto caminhos novos quanto legados do banco.
 */
export async function downloadFile(key: string): Promise<string> {
  const supabase = getSupabaseAdmin()
  const storagePath = legacyPathToStoragePath(key)

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600) // 1 hora

  if (error) {
    throw new Error(`Signed URL failed: ${error.message}`)
  }
  return data.signedUrl
}

/**
 * Obtém o conteúdo de um arquivo como Buffer.
 * Aceita tanto caminhos novos quanto legados do banco.
 */
export async function getFileBuffer(key: string): Promise<Buffer> {
  const supabase = getSupabaseAdmin()
  const storagePath = legacyPathToStoragePath(key)

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(storagePath)

  if (error) {
    throw new Error(`Download failed: ${error.message}`)
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Deleta um arquivo do storage.
 */
export async function deleteFile(key: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const storagePath = legacyPathToStoragePath(key)

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}
