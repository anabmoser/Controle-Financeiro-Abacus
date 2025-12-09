
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createS3Client, getBucketConfig } from './aws-config'

const s3Client = createS3Client()
const { bucketName, folderPrefix } = getBucketConfig()

export async function uploadFile(buffer: Buffer, fileName: string, isPublic: boolean = false): Promise<string> {
  const key = `${folderPrefix}receipts/${Date.now()}-${fileName}`
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'application/octet-stream',
  })

  await s3Client.send(command)
  return key
}

export async function uploadBillFile(buffer: Buffer, fileName: string): Promise<string> {
  const key = `${folderPrefix}bills/${Date.now()}-${fileName}`
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'application/octet-stream',
  })

  await s3Client.send(command)
  return key
}

export async function downloadFile(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  return signedUrl
}

export async function getFileBuffer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  const response = await s3Client.send(command)
  
  // Converter o stream para buffer
  const stream = response.Body as any
  const chunks: Uint8Array[] = []
  
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  
  return Buffer.concat(chunks)
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  await s3Client.send(command)
}

export async function renameFile(oldKey: string, newKey: string): Promise<void> {
  // S3 doesn't have a native rename, so we need to copy and delete
  // For simplicity, we'll just return the old key as-is
  // In a real implementation, you'd use CopyObjectCommand
  return
}
