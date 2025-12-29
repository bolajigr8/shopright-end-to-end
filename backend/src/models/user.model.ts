import mongoose, { Schema, Document, Model } from 'mongoose'

/* =======================
   TypeScript Interfaces
======================= */

interface Address {
  label: string
  fullName: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  phoneNumber: string
  isDefault: boolean
}

interface UserDocument extends Document {
  email: string
  name: string
  imageUrl: string
  clerkId: string
  stripeCustomerId: string
  addresses: Address[]
  wishlist: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

/* =======================
   Address Schema
======================= */

const addressSchema = new Schema<Address>(
  {
    label: { type: String, required: true },
    fullName: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false } // prevents extra _id for subdocuments
)

/* =======================
   User Schema
======================= */

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeCustomerId: {
      type: String,
      default: '',
    },
    addresses: [addressSchema],
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true }
)

export const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>('User', userSchema)
