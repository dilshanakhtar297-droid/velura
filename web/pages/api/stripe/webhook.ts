import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { prisma } from '../../../prisma'

export const config = {
  api: {
    bodyParser: false
  }
}

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || 'sk_test_replace_me'
const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2022-11-15' })

function buffer(readable: any) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: any[] = []
    readable.on('data', (chunk: any) => chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk))
    readable.on('end', () => resolve(Buffer.concat(chunks)))
    readable.on('error', (err: any) => reject(err))
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sig = req.headers['stripe-signature'] as string | undefined
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_replace_me'
  let event: Stripe.Event
  try {
    const buf = await buffer(req)
    event = stripe.webhooks.constructEvent(buf, sig || '', webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message)
    return res.status(400).send('Webhook error')
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    try {
      if (session.id) {
        const existing = await prisma.order.findFirst({ where: { stripeSessionId: session.id } })
        if (existing) {
          await prisma.order.update({ where: { id: existing.id }, data: { status: 'paid' } })
        } else {
          await prisma.order.create({ data: { amountCents: session.amount_total || 0, stripeSessionId: session.id, status: 'paid' } })
        }
      }
    } catch (e) {
      console.error('Error updating order from webhook', e)
    }
  }

  res.json({ received: true })
}
