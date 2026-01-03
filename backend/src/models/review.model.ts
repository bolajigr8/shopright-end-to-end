import mongoose, { Schema, Document, Model } from 'mongoose'

interface ReviewDocument extends Document {
  productId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  orderId: mongoose.Types.ObjectId
  rating: number
  createdAt: Date
  updatedAt: Date
}

/* =======================
   Schema
======================= */

const reviewSchema = new Schema<ReviewDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
)

/* =======================
   Model
======================= */

export const Review: Model<ReviewDocument> =
  mongoose.models.Review ||
  mongoose.model<ReviewDocument>('Review', reviewSchema)
