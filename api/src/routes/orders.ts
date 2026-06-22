import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from './utils/auth'

const router = Router()
const prisma = new PrismaClient()

router.get('/', requireAdmin, async (req, res) => {
  try{
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(orders)
  } catch (e:any) {
    res.status(500).json({ error: e.message })
  }
})

export default router
