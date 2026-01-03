import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Cart } from '../models/cart.model.js'
import { Product } from '../models/product.model.js'
import { AuthRequest } from '../types/types.js'

/* =======================
   Request Body Interfaces
======================= */

interface AddToCartBody {
  productId: string
  quantity?: number
}

interface UpdateCartItemBody {
  quantity: number
}

/* =======================
   Controllers
======================= */

export async function getCart(req: Request, res: Response): Promise<void> {
  try {
    let cart = await Cart.findOne({
      clerkId: (req as AuthRequest).user.clerkId,
    }).populate('items.product')

    if (!cart) {
      const user = (req as AuthRequest).user

      cart = await Cart.create({
        user: user._id,
        clerkId: user.clerkId,
        items: [],
      })
    }

    res.status(200).json({ cart })
  } catch (error) {
    console.error('Error in getCart controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function addToCart(req: Request, res: Response): Promise<void> {
  try {
    const { productId, quantity = 1 } = req.body as AddToCartBody

    // validate product exists and has stock
    const product = await Product.findById(productId)
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }

    if (product.stock < quantity) {
      res.status(400).json({ error: 'Insufficient stock' })
      return
    }

    let cart = await Cart.findOne({
      clerkId: (req as AuthRequest).user.clerkId,
    })

    if (!cart) {
      const user = (req as AuthRequest).user

      cart = await Cart.create({
        user: user._id,
        clerkId: user.clerkId,
        items: [],
      })
    }

    // check if item already in the cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    )
    if (existingItem) {
      // increment quantity by 1
      const newQuantity = existingItem.quantity + 1
      if (product.stock < newQuantity) {
        res.status(400).json({ error: 'Insufficient stock' })
        return
      }
      existingItem.quantity = newQuantity
    } else {
      // add new item
      cart.items.push({ product: productId as any, quantity })
    }

    await cart.save()

    res.status(200).json({ message: 'Item added to cart', cart })
  } catch (error) {
    console.error('Error in addToCart controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateCartItem(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { productId } = req.params
    const { quantity } = req.body as UpdateCartItemBody

    if (quantity < 1) {
      res.status(400).json({ error: 'Quantity must be at least 1' })
      return
    }

    const cart = await Cart.findOne({
      clerkId: (req as AuthRequest).user.clerkId,
    })
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' })
      return
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    )
    if (itemIndex === -1) {
      res.status(404).json({ error: 'Item not found in cart' })
      return
    }

    // check if product exists & validate stock
    const product = await Product.findById(productId)
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }

    if (product.stock < quantity) {
      res.status(400).json({ error: 'Insufficient stock' })
      return
    }

    cart.items[itemIndex].quantity = quantity
    await cart.save()

    res.status(200).json({ message: 'Cart updated successfully', cart })
  } catch (error) {
    console.error('Error in updateCartItem controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function removeFromCart(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { productId } = req.params

    const cart = await Cart.findOne({
      clerkId: (req as AuthRequest).user.clerkId,
    })
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' })
      return
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    )
    await cart.save()

    res.status(200).json({ message: 'Item removed from cart', cart })
  } catch (error) {
    console.error('Error in removeFromCart controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function clearCart(req: Request, res: Response): Promise<void> {
  try {
    const cart = await Cart.findOne({
      clerkId: (req as AuthRequest).user.clerkId,
    })
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' })
      return
    }

    cart.items = []
    await cart.save()

    res.status(200).json({ message: 'Cart cleared', cart })
  } catch (error) {
    console.error('Error in clearCart controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
