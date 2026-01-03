import { Request, Response } from 'express'
import { Product } from '../models/product.model.js'
import { Types } from 'mongoose'

export async function getProductById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid product ID format' })
      return
    }

    const product = await Product.findById(id)

    if (!product) {
      res.status(404).json({ message: 'Product not found' })
      return
    }

    res.status(200).json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
