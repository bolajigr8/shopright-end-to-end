import { Inngest } from 'inngest'
import { connectDB } from './db.js'
import { User } from '../models/user.model.js'

/* =======================
   Inngest Client
======================= */

export const inngest = new Inngest({ id: 'shopright-app' })

/* =======================
   Event Payload Types
======================= */

interface ClerkUserCreatedEvent {
  data: {
    id: string
    email_addresses: Array<{
      email_address: string
    }>
    first_name?: string | null
    last_name?: string | null
    image_url?: string | null
  }
}

interface ClerkUserDeletedEvent {
  data: {
    id: string
  }
}

/* =======================
   Sync User Function
======================= */

const syncUser = inngest.createFunction(
  { id: 'sync-user' },
  { event: 'clerk/user.created' },
  async ({ event }: { event: ClerkUserCreatedEvent }) => {
    try {
      await connectDB()

      const { id, email_addresses, first_name, last_name, image_url } =
        event.data

      const email = email_addresses?.[0]?.email_address
      if (!email) {
        throw new Error(`User ${id} has no email address`)
      }

      // Check if user already exists (idempotency)
      const existingUser = await User.findOne({ clerkId: id })
      if (existingUser) {
        console.log(`User with clerkId ${id} already exists, skipping creation`)
        return { status: 'skipped', userId: existingUser._id }
      }

      const newUser = {
        clerkId: id,
        email,
        name: `${first_name ?? ''} ${last_name ?? ''}`.trim() || 'User',
        imageUrl: image_url ?? '',
        addresses: [],
        wishlist: [],
      }

      const createdUser = await User.create(newUser)
      return { status: 'created', userId: createdUser._id }
    } catch (error) {
      console.error('Error syncing user:', error)
      throw error
    }
  }
)

/* =======================
   Delete User Function
======================= */
const deleteUserFromDB = inngest.createFunction(
  { id: 'delete-user-from-db' },
  { event: 'clerk/user.deleted' },
  async ({ event }: { event: ClerkUserDeletedEvent }) => {
    try {
      await connectDB()

      const { id } = event.data
      const result = await User.deleteOne({ clerkId: id })

      return {
        status: result.deletedCount > 0 ? 'deleted' : 'not_found',
        deletedCount: result.deletedCount,
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }
)

export const functions = [syncUser, deleteUserFromDB]
