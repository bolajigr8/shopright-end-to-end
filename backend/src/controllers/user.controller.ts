import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import { User, UserDocument } from '../models/user.model.js'

// Extend Express Request to include authenticated user
export interface AuthRequest extends Request {
  user: UserDocument
}

interface AddressBody {
  label?: string
  fullName: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  phoneNumber?: string
  isDefault?: boolean
}

interface WishlistBody {
  productId: string
}

export async function addAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      label,
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      isDefault,
    } = req.body as AddressBody

    const user = (req as AuthRequest).user

    if (!fullName || !streetAddress || !city || !state || !zipCode) {
      res.status(400).json({ error: 'Missing required address fields' })
      return
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false
      })
    }

    user.addresses.push({
      label: label || '',
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber: phoneNumber || '',
      isDefault: isDefault || false,
    })

    await user.save()

    res.status(201).json({
      message: 'Address added successfully',
      addresses: user.addresses,
    })
  } catch (error) {
    console.error('Error in addAddress controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getAddresses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as AuthRequest).user

    res.status(200).json({ addresses: user.addresses })
  } catch (error) {
    console.error('Error in getAddresses controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      label,
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      isDefault,
    } = req.body as AddressBody

    const { addressId } = req.params

    const user = (req as AuthRequest).user

    const address = user.addresses.id(addressId)
    if (!address) {
      res.status(404).json({ error: 'Address not found' })
      return
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false
      })
    }

    address.label = label || address.label
    address.fullName = fullName || address.fullName
    address.streetAddress = streetAddress || address.streetAddress
    address.city = city || address.city
    address.state = state || address.state
    address.zipCode = zipCode || address.zipCode
    address.phoneNumber = phoneNumber || address.phoneNumber
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault

    await user.save()

    res.status(200).json({
      message: 'Address updated successfully',
      addresses: user.addresses,
    })
  } catch (error) {
    console.error('Error in updateAddress controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function deleteAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { addressId } = req.params
    const user = (req as AuthRequest).user

    user.addresses.pull(addressId)
    await user.save()

    res.status(200).json({
      message: 'Address deleted successfully',
      addresses: user.addresses,
    })
  } catch (error) {
    console.error('Error in deleteAddress controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function addToWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId } = req.body as WishlistBody
    const user = (req as AuthRequest).user

    const productObjectId = new Types.ObjectId(productId)

    // check if product is already in the wishlist
    if (user.wishlist.includes(productObjectId)) {
      res.status(400).json({ error: 'Product already in wishlist' })
      return
    }

    user.wishlist.push(productObjectId)
    await user.save()

    res
      .status(200)
      .json({ message: 'Product added to wishlist', wishlist: user.wishlist })
  } catch (error) {
    console.error('Error in addToWishlist controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function removeFromWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId } = req.params
    const user = (req as AuthRequest).user

    const productObjectId = new Types.ObjectId(productId)

    // check if product is already in the wishlist
    if (!user.wishlist.includes(productObjectId)) {
      res.status(400).json({ error: 'Product not found in wishlist' })
      return
    }

    user.wishlist.pull(productObjectId)
    await user.save()

    res.status(200).json({
      message: 'Product removed from wishlist',
      wishlist: user.wishlist,
    })
  } catch (error) {
    console.error('Error in removeFromWishlist controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // we're using populate, bc wishlist is just an array of product ids
    const user = await User.findById((req as AuthRequest).user._id).populate(
      'wishlist'
    )

    res.status(200).json({ wishlist: user?.wishlist || [] })
  } catch (error) {
    console.error('Error in getWishlist controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
