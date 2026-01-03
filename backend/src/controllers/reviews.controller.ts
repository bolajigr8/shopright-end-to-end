import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Order } from '../models/order.model.js'
import { Review } from '../models/review.model.js'
import { Product } from '../models/product.model.js'
import { AuthRequest } from '../types/types.js'

/* =======================
   Request Body Interfaces
======================= */

interface CreateReviewBody {
  productId: string
  orderId: string
  rating: number
}

/* =======================
   Controllers
======================= */

export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const { productId, orderId, rating } = req.body as CreateReviewBody

    if (typeof rating !== 'number' || !rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' })
      return
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ error: 'Invalid product ID format' })
      return
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ error: 'Invalid order ID format' })
      return
    }

    const user = (req as AuthRequest).user

    // verify order exists and is delivered
    const order = await Order.findById(orderId)
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    if (order.clerkId !== user.clerkId) {
      res.status(403).json({ error: 'Not authorized to review this order' })
      return
    }

    if (order.status !== 'delivered') {
      res.status(400).json({ error: 'Can only review delivered orders' })
      return
    }

    // verify product is in the order
    const productInOrder = order.orderItems.find(
      (item) => item.product.toString() === productId.toString()
    )
    if (!productInOrder) {
      res.status(400).json({ error: 'Product not found in this order' })
      return
    }
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // atomic update or create
      const review = await Review.findOneAndUpdate(
        { productId, userId: user._id },
        { rating, orderId, productId, userId: user._id },
        { new: true, upsert: true, runValidators: true, session }
      )

      // update the product rating with atomic aggregation
      const reviews = await Review.find({ productId }, null, { session })
      const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0)
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          averageRating: totalRating / reviews.length,
          totalReviews: reviews.length,
        },
        { new: true, runValidators: true, session }
      )

      if (!updatedProduct) {
        throw new Error('Product not found')
      }

      await session.commitTransaction()
      res.status(201).json({ message: 'Review submitted successfully', review })
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  } catch (error) {
    console.error('Error in createReview controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function deleteReview(req: Request, res: Response): Promise<void> {
  try {
    const { reviewId } = req.params

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ error: 'Invalid review ID format' })
      return
    }

    const user = (req as AuthRequest).user

    const review = await Review.findById(reviewId)
    if (!review) {
      res.status(404).json({ error: 'Review not found' })
      return
    }

    if (review.userId.toString() !== user._id.toString()) {
      res.status(403).json({ error: 'Not authorized to delete this review' })
      return
    }

    const productId = review.productId

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      await Review.findByIdAndDelete(reviewId, { session })

      const reviews = await Review.find({ productId }, null, { session })
      const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0)

      await Product.findByIdAndUpdate(
        productId,
        {
          averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
          totalReviews: reviews.length,
        },
        { session }
      )

      await session.commitTransaction()
      res.status(200).json({ message: 'Review deleted successfully' })
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  } catch (error) {
    console.error('Error in deleteReview controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
