import { Router } from 'express'
import AWS from 'aws-sdk'
import { requireAdmin } from '../utils/auth'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

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

// Ensure bucket exists (idempotent)
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

// Admin requests a presigned URL to upload a file directly to S3/MinIO
router.post('/presign', requireAdmin, async (req, res) => {
  const { filename, contentType, productId } = req.body
  if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' })

  await ensureBucket()

  const key = `products/${productId || 'unattached'}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`

  const params: AWS.S3.PutObjectRequest = {
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
    // ACL: 'public-read' // MinIO may not require ACL; leaving out for compatibility
  }

  const presignedUrl = s3.getSignedUrl('putObject', { ...params, Expires: 60 * 5 })
  const publicUrl = `${S3_ENDPOINT.replace(/\/$/, '')}/${S3_BUCKET}/${key}`

  res.json({ presignedUrl, url: publicUrl, key })
})

// After client uploads to presigned URL, call this to create a ModelAsset record
router.post('/complete', requireAdmin, async (req, res) => {
  const { productId, url, format, main } = req.body
  if (!productId || !url) return res.status(400).json({ error: 'productId and url required' })

  try {
    const asset = await prisma.modelAsset.create({ data: { productId: Number(productId), url, format: format || 'glb', main: !!main } })
    res.json(asset)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

export default router
