import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req, res) => {
  const products = await prisma.product.findMany({ include: { assets: true } })
  res.json(products)
})

router.get('/slug/:slug', async (req, res) => {
  const slug = req.params.slug
  const product = await prisma.product.findUnique({ where: { slug }, include: { assets: true } })
  if (!product) return res.status(404).json({ error: 'not found' })
  res.json(product)
})

export default router
