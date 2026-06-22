import type { NextApiRequest, NextApiResponse } from 'next'
import AWS from 'aws-sdk'
import { prisma } from '../../../prisma'

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://minio:9000'
const S3_BUCKET = process.env.S3_BUCKET || 'velura-assets'
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin'
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin'
const S3_FORCE_PATH_STYLE = (process.env.S3_FORCE_PATH_STYLE || 'true') === 'true'

const s3 = new AWS.S3({
  endpoint: S3_ENDPOINT,
  accessKeyId: S3_ACCESS_KEY,
  secretAccessKey: S3_SECRET_KEY,
  s3ForcePathStyle: S3_FORCE_PATH_STYLE,
  signatureVersion: 'v4'
})

async function ensureBucket() {
  try {
    await s3.headBucket({ Bucket: S3_BUCKET }).promise()
  } catch (e: any) {
    try {
      await s3.createBucket({ Bucket: S3_BUCKET }).promise()
    } catch (err) {
      console.error('Error creating bucket', err)
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const auth = req.headers.authorization || ''
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' })
  const token = auth.replace('Bearer ', '')
  try {
    const jwt = await import('jsonwebtoken')
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'dev_secret') as any
    if (payload.role !== 'admin') return res.status(403).json({ error: 'admin required' })
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' })
  }

  const { filename, contentType, productId } = req.body
  if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' })

  await ensureBucket()

  const key = `products/${productId || 'unattached'}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`

  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType
  }

  const presignedUrl = s3.getSignedUrl('putObject', { ...params, Expires: 60 * 5 })
  const publicUrl = `${S3_ENDPOINT.replace(/\/$/, '')}/${S3_BUCKET}/${key}`

  res.json({ presignedUrl, url: publicUrl, key })
}
