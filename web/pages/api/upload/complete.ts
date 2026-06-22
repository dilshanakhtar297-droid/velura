import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../prisma'

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

  const { productId, url, format, main } = req.body
  if (!productId || !url) return res.status(400).json({ error: 'productId and url required' })

  try {
    const asset = await prisma.modelAsset.create({ data: { productId: Number(productId), url, format: format || 'glb', main: !!main } })
    res.json(asset)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
}
