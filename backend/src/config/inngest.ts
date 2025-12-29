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
    await connectDB()

    const { id, email_addresses, first_name, last_name, image_url } = event.data

    const newUser = {
      clerkId: id,
      email: email_addresses?.[0]?.email_address ?? '',
      name: `${first_name ?? ''} ${last_name ?? ''}`.trim() || 'User',
      imageUrl: image_url ?? '',
      addresses: [],
      wishlist: [],
    }

    await User.create(newUser)
  }
)

/* =======================
   Delete User Function
======================= */

const deleteUserFromDB = inngest.createFunction(
  { id: 'delete-user-from-db' },
  { event: 'clerk/user.deleted' },
  async ({ event }: { event: ClerkUserDeletedEvent }) => {
    await connectDB()

    const { id } = event.data
    await User.deleteOne({ clerkId: id })
  }
)

/* =======================
   Export Functions
======================= */

export const functions = [syncUser, deleteUserFromDB]
