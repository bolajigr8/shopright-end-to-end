import mongoose, { Schema, Document, Model } from 'mongoose'

interface ProductDocument extends Document {
  name: string
  description: string
  price: number
  stock: number
  category: string
  images: string[]
  averageRating: number
  totalReviews: number
  createdAt: Date
  updatedAt: Date
}

/* =======================
   Schema
======================= */

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: { type: String, required: true },
    images: [{ type: String, required: true }],
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
)

/* =======================
   Model
======================= */

export const Product: Model<ProductDocument> =
  mongoose.models.Product ||
  mongoose.model<ProductDocument>('Product', productSchema)
