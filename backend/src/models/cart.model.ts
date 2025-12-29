import mongoose, { Schema, Document, Model } from 'mongoose'

/* =======================
   Interfaces
======================= */

interface CartItem {
  product: mongoose.Types.ObjectId
  quantity: number
}

interface CartDocument extends Document {
  user: mongoose.Types.ObjectId
  clerkId: string
  items: CartItem[]
  createdAt: Date
  updatedAt: Date
}

/* =======================
   Schemas
======================= */

const cartItemSchema = new Schema<CartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false }
)

const cartSchema = new Schema<CartDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
)

/* =======================
   Model
======================= */

export const Cart: Model<CartDocument> =
  mongoose.models.Cart || mongoose.model<CartDocument>('Cart', cartSchema)
