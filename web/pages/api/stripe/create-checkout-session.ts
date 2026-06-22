import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { prisma } from '../../prisma'

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || 'sk_test_replace_me'
const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2022-11-15' })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { productId } = req.body
  if (!productId) return res.status(400).json({ error: 'productId required' })
  const product = await prisma.product.findUnique({ where: { id: Number(productId) } })
  if (!product) return res.status(404).json({ error: 'product not found' })

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: product.title },
            unit_amount: product.priceCents
          },
          quantity: 1
        }
      ],
      success_url: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') + '/success',
      cancel_url: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') + '/cancel'
    })

    await prisma.order.create({ data: { amountCents: product.priceCents, stripeSessionId: session.id || undefined, status: 'pending' } })

    res.json({ url: session.url, id: session.id })
  } catch (e: any) {
    console.error('stripe error', e)
    res.status(500).json({ error: e.message })
  }
}
