import { Request, Response } from 'express'
import cloudinary from '../config/cloudinary.js'
import { Product } from '../models/product.model.js'
import { Order } from '../models/order.model.js'
import { User } from '../models/user.model.js'
import { MulterRequest } from '../types/types.js'

export async function createProduct(
  req: MulterRequest,
  res: Response
): Promise<void> {
  try {
    const { name, description, price, stock, category } = req.body

    if (!name || !description || !price || !stock || !category) {
      res.status(400).json({ message: 'All fields are required' })
      return
    }

    // Fix: Type guard to ensure files is an array
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ message: 'At least one image is required' })
      return
    }

    if (req.files.length > 3) {
      res.status(400).json({ message: 'Maximum 3 images allowed' })
      return
    }

    const uploadPromises = req.files.map((file) => {
      return cloudinary.uploader.upload(file.path, {
        folder: 'products',
      })
    })

    const uploadResults = await Promise.all(uploadPromises)

    const imageUrls = uploadResults.map((result) => result.secure_url)

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      images: imageUrls,
    })

    res.status(201).json(product)
  } catch (error) {
    console.error('Error creating product', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getAllProducts(_: Request, res: Response): Promise<void> {
  try {
    // -1 means descending order and recent procucts first
    const products = await Product.find().sort({ createdAt: -1 })
    res.status(200).json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function updateProduct(
  req: MulterRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params
    const { name, description, price, stock, category } = req.body

    const product = await Product.findById(id)
    if (!product) {
      res.status(404).json({ message: 'Product not found' })
      return
    }

    if (name) product.name = name
    if (description) product.description = description
    if (price !== undefined) product.price = parseFloat(price)
    if (stock !== undefined) product.stock = parseInt(stock)
    if (category) product.category = category

    // Fix: Type guard to ensure files is an array
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      if (req.files.length > 3) {
        res.status(400).json({ message: 'Maximum 3 images allowed' })
        return
      }

      const uploadPromises = req.files.map((file) => {
        return cloudinary.uploader.upload(file.path, {
          folder: 'products',
        })
      })

      const uploadResults = await Promise.all(uploadPromises)
      product.images = uploadResults.map((result) => result.secure_url)
    }

    await product.save()
    res.status(200).json(product)
  } catch (error) {
    console.error('Error updating products:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getAllOrders(_: Request, res: Response): Promise<void> {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('orderItems.product')
      .sort({ createdAt: -1 })

    res.status(200).json({ orders })
  } catch (error) {
    console.error('Error in getAllOrders controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateOrderStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { orderId } = req.params
    const { status } = req.body

    if (!['pending', 'shipped', 'delivered'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' })
      return
    }

    const order = await Order.findById(orderId)
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    order.status = status

    if (status === 'shipped' && !order.shippedAt) {
      order.shippedAt = new Date()
    }

    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date()
    }

    await order.save()

    res
      .status(200)
      .json({ message: 'Order status updated successfully', order })
  } catch (error) {
    console.error('Error in updateOrderStatus controller:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getAllCustomers(
  _: Request,
  res: Response
): Promise<void> {
  try {
    const customers = await User.find().sort({ createdAt: -1 })
    res.status(200).json({ customers })
  } catch (error) {
    console.error('Error fetching customers:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getDashboardStats(
  _: Request,
  res: Response
): Promise<void> {
  try {
    const totalOrders = await Order.countDocuments()

    const revenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' },
        },
      },
    ])

    const totalRevenue = revenueResult[0]?.total || 0

    const totalCustomers = await User.countDocuments()
    const totalProducts = await Product.countDocuments()

    res.status(200).json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params

    const product = await Product.findById(id)
    if (!product) {
      res.status(404).json({ message: 'Product not found' })
      return
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map((imageUrl: string) => {
        const publicId =
          'products/' + imageUrl.split('/products/')[1]?.split('.')[0]
        if (publicId) return cloudinary.uploader.destroy(publicId)
      })
      await Promise.all(deletePromises.filter(Boolean))
    }

    await Product.findByIdAndDelete(id)
    res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({ message: 'Failed to delete product' })
  }
}
