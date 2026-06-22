import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const products = await prisma.product.findMany({ include: { assets: true } })
    return res.json(products)
  }

  if (req.method === 'POST') {
    // protected: require admin via Authorization: Bearer <token>
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

    const { title, description, priceCents, slug, sku, assets } = req.body
    if (!title || !priceCents || !slug) return res.status(400).json({ error: 'missing fields' })

    try {
      const product = await prisma.product.create({
        data: {
          title,
          description,
          priceCents,
          slug,
          sku,
          assets: assets && assets.length ? { create: assets } : undefined
        },
        include: { assets: true }
      })
      return res.json(product)
    } catch (e: any) {
      return res.status(500).json({ error: e.message })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
