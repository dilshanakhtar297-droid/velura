import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import productsRouter from './routes/products'
import authRouter from './routes/auth'
import uploadsRouter from './routes/uploads'
import ordersRouter from './routes/orders'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const app = express()
const prisma = new PrismaClient()

// Stripe setup
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || 'sk_test_replace_me'
const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2022-11-15' })

// raw body endpoint for webhook must be registered before bodyParser.json()
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string | undefined
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_replace_me'
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig || '', webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message)
    return res.status(400).send('Webhook error')
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    // Find order by stripeSessionId and mark paid, or create order
    try {
      if (session.id) {
        const existing = await prisma.order.findFirst({ where: { stripeSessionId: session.id } })
        if (existing) {
          await prisma.order.update({ where: { id: existing.id }, data: { status: 'paid' } })
        } else {
          // create basic order record
          await prisma.order.create({ data: { amountCents: session.amount_total || 0, stripeSessionId: session.id, status: 'paid' } })
        }
      }
    } catch (e) {
      console.error('Error updating order from webhook', e)
    }
  }

  res.json({ received: true })
})

app.use(bodyParser.json())
app.use(cors())

app.use('/products', productsRouter)
app.use('/auth', authRouter)
app.use('/upload', uploadsRouter)
app.use('/orders', ordersRouter)

// Create checkout session for a product
app.post('/stripe/create-checkout-session', async (req, res) => {
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

    // create an order placeholder
    await prisma.order.create({ data: { amountCents: product.priceCents, stripeSessionId: session.id || undefined, status: 'pending' } })

    res.json({ url: session.url, id: session.id })
  } catch (e: any) {
    console.error('stripe error', e)
    res.status(500).json({ error: e.message })
  }
})

app.get('/', (req, res) => res.send({ ok: true, message: 'Velura API' }))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`API listening on ${PORT}`))
