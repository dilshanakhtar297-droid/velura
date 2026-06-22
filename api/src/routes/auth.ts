import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const router = Router()
const prisma = new PrismaClient()
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev_secret'

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'invalid credentials' })

  // NOTE: passwords are stored in plain text in the dev seed. Replace with bcrypt in production.
  if (user.password !== password) return res.status(401).json({ error: 'invalid credentials' })

  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
})

export default router
