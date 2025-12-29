import mongoose, { Schema, Document, Model } from 'mongoose'

/* =======================
   Interfaces
======================= */

interface OrderItem {
  product: mongoose.Types.ObjectId
  name: string
  price: number
  quantity: number
  image: string
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
  id?: string
  status?: string
}

interface OrderDocument extends Document {
  user: mongoose.Types.ObjectId
  clerkId: string
  orderItems: OrderItem[]
  shippingAddress: ShippingAddress
  paymentResult?: PaymentResult
  totalPrice: number
  status: 'pending' | 'shipped' | 'delivered'
  deliveredAt?: Date
  shippedAt?: Date
  createdAt: Date
  updatedAt: Date
}

/* =======================
   Schemas
======================= */

const orderItemSchema = new Schema<OrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, required: true },
  },
  { _id: false }
)

const shippingAddressSchema = new Schema<ShippingAddress>(
  {
    fullName: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    phoneNumber: { type: String, required: true },
  },
  { _id: false }
)

const orderSchema = new Schema<OrderDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clerkId: {
      type: String,
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    paymentResult: {
      id: String,
      status: String,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'shipped', 'delivered'],
      default: 'pending',
    },
    deliveredAt: Date,
    shippedAt: Date,
  },
  { timestamps: true }
)

/* =======================
   Model
======================= */

export const Order: Model<OrderDocument> =
  mongoose.models.Order || mongoose.model<OrderDocument>('Order', orderSchema)
