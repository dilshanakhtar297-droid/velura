import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const product = await prisma.product.findUnique({ where: { slug: String(slug) }, include: { assets: true } })
  if (!product) return res.status(404).json({ error: 'not found' })
  res.json(product)
}
