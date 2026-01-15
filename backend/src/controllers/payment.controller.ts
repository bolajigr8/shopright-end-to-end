import Stripe from 'stripe'
import { Request, Response } from 'express'
import { ENV } from '../config/env.js'
import { User, UserDocument } from '../models/user.model.js'
import { Product } from '../models/product.model.js'
import { Order } from '../models/order.model.js'
import { AuthRequest } from '../types/types.js'

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY)

// Interfaces
interface CartItem {
  product: {
    _id: string
    name: string
  }
  quantity: number
}

interface ShippingAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface ValidatedItem {
  product: string
  name: string
  price: number
  quantity: number
  image: string
}

interface PaymentIntentRequestBody {
  cartItems: CartItem[]
  shippingAddress: ShippingAddress
}

// interface AuthenticatedRequest
//   extends Request<{}, {}, PaymentIntentRequestBody> {
//   user: UserDocument
// }

interface PaymentIntentMetadata {
  userId: string
  clerkId: string
  orderItems: string
  shippingAddress: string
  totalPrice: string
}

export async function createPaymentIntent(
  req: Request,
  res: Response
): Promise<Response> {
  // Type guard to ensure user exists
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const authenticatedReq = req as AuthRequest
  try {
    const { cartItems, shippingAddress } = authenticatedReq.body
    const user = authenticatedReq.user

    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    // Calculate total from server-side (don't trust client - ever.)
    let subtotal = 0
    const validatedItems: ValidatedItem[] = []

    for (const item of cartItems) {
      const product = await Product.findById(item.product._id)
      if (!product) {
        return res
          .status(404)
          .json({ error: `Product ${item.product.name} not found` })
      }

      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: `Insufficient stock for ${product.name}` })
      }

      subtotal += product.price * item.quantity
      validatedItems.push({
        product: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0],
      })
    }

    const shipping: number = 10.0 // $10
    const tax: number = subtotal * 0.08 // 8%
    const total: number = subtotal + shipping + tax

    if (total <= 0) {
      return res.status(400).json({ error: 'Invalid order total' })
    }

    // find or create the stripe customer
    let customer: Stripe.Customer
    if (user.stripeCustomerId) {
      // find the customer
      customer = (await stripe.customers.retrieve(
        user.stripeCustomerId
      )) as Stripe.Customer
    } else {
      // create the customer
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          clerkId: user.clerkId,
          userId: user._id.toString(),
        },
      })

      // add the stripe customer ID to the user object in the DB
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customer.id })
    }

    // create payment intent
    const paymentIntent: Stripe.PaymentIntent =
      await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // convert to cents
        currency: 'usd',
        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          clerkId: user.clerkId,
          userId: user._id.toString(),
          orderItems: JSON.stringify(validatedItems),
          shippingAddress: JSON.stringify(shippingAddress),
          totalPrice: total.toFixed(2),
        },
        // in the webhooks section we will use this metadata
      })

    return res.status(200).json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return res.status(500).json({ error: 'Failed to create payment intent' })
  }
}

export async function handleWebhook(
  req: Request,
  res: Response
): Promise<Response> {
  const sig = req.headers['stripe-signature']
  let event: Stripe.Event

  try {
    if (!sig) {
      return res.status(400).send('Missing stripe-signature header')
    }

    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', errorMessage)
    return res.status(400).send(`Webhook Error: ${errorMessage}`)
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent

    console.log('Payment succeeded:', paymentIntent.id)

    try {
      const metadata =
        paymentIntent.metadata as unknown as PaymentIntentMetadata
      const { userId, clerkId, orderItems, shippingAddress, totalPrice } =
        metadata

      // Check if order already exists (prevent duplicates)
      const existingOrder = await Order.findOne({
        'paymentResult.id': paymentIntent.id,
      })
      if (existingOrder) {
        console.log('Order already exists for payment:', paymentIntent.id)
        return res.json({ received: true })
      }

      // create order
      const order = await Order.create({
        user: userId,
        clerkId,
        orderItems: JSON.parse(orderItems),
        shippingAddress: JSON.parse(shippingAddress),
        paymentResult: {
          id: paymentIntent.id,
          status: 'succeeded',
        },
        totalPrice: parseFloat(totalPrice),
      })

      // update product stock
      const items: ValidatedItem[] = JSON.parse(orderItems)
      for (const item of items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        })
      }

      console.log('Order created successfully:', order._id)
    } catch (error) {
      console.error('Error creating order from webhook:', error)
    }
  }

  return res.json({ received: true })
}
