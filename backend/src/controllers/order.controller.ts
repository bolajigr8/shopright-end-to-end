import { Request, Response, NextFunction } from 'express'
import { Order } from '../models/order.model.js'
import { Product } from '../models/product.model.js'
import { Review } from '../models/review.model.js'
import { AuthRequest } from '../types/types.js'
import mongoose from 'mongoose'

interface OrderItem {
  product: {
    _id: string
    name: string
    image: string
    price: number
  }
  name: string
  quantity: number
  price: number
}

interface ShippingAddress {
  fullName: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  phoneNumber: string
}

interface PaymentResult {
  id: string
  status: string
  update_time: string
  email_address: string
}

interface CreateOrderBody {
  orderItems: OrderItem[]
  shippingAddress: ShippingAddress
  paymentResult: PaymentResult
  totalPrice: number
}

export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const user = (req as AuthRequest).user
    const { orderItems, shippingAddress, paymentResult, totalPrice } =
      req.body as CreateOrderBody

    if (!orderItems || orderItems.length === 0) {
      res.status(400).json({ error: 'No order items' })
      return
    }

    if (!shippingAddress || !paymentResult || !totalPrice) {
      res.status(400).json({ error: 'Missing required order information' })
      return
    }

    if (totalPrice <= 0) {
      res.status(400).json({ error: 'Invalid total price' })
      return
    }

    // validate products and stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product._id).session(session)
      if (!product) {
        await session.abortTransaction()

        res.status(404).json({ error: `Product ${item.name} not found` })
        return
      }
      if (product.stock < item.quantity) {
        await session.abortTransaction()

        res
          .status(400)
          .json({ error: `Insufficient stock for ${product.name}` })
        return
      }
    }

    const order = await Order.create(
      [
        {
          user: user._id,
          clerkId: user.clerkId,
          orderItems,
          shippingAddress,
          paymentResult,
          totalPrice,
        },
      ],
      { session }
    )

    // update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product._id,
        {
          $inc: { stock: -item.quantity },
        },
        { session }
      )
    }

    await session.commitTransaction()

    res.status(201).json({ message: 'Order created successfully', order })
  } catch (error) {
    console.error('Error in createOrder controller:', error)

    await session.abortTransaction()
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    session.endSession()
  }
}

export async function getUserOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orders = await Order.find({
      clerkId: (req as AuthRequest).user.clerkId,
    })
      .populate('orderItems.product')
      .sort({ createdAt: -1 }) // descending order

    // check if each order has been reviewed
    const orderIds = orders.map((order) => order._id)
    const reviews = await Review.find({ orderId: { $in: orderIds } })
    const reviewedOrderIds = new Set(
      reviews.map((review) => review.orderId.toString())
    )

    const ordersWithReviewStatus = await Promise.all(
      orders.map(async (order) => {
        return {
          ...order.toObject(),
          hasReviewed: reviewedOrderIds.has(order._id.toString()),
        }
      })
    )

    res.status(200).json({ orders: ordersWithReviewStatus })
  } catch (error) {
    console.error('Error in getUserOrders controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
