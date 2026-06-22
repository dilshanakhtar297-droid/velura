import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '../utils/auth'

const router = Router()
const prisma = new PrismaClient()

// public
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

// admin-protected routes
router.post('/', requireAdmin, async (req, res) => {
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
    res.json(product)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  const { title, description, priceCents, slug, sku } = req.body
  try {
    const product = await prisma.product.update({ where: { id }, data: { title, description, priceCents, slug, sku } })
    res.json(product)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  try {
    await prisma.product.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

export default router
