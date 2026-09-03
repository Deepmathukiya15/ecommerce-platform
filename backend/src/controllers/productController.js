const mongoose = require('mongoose');
const Product = require('../models/Product');
const { uploadToCloudinary, destroyFromCloudinary } = require('../config/cloudinary');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @route   GET /api/products
 * @desc    Public listing with keyword search, category filter, price range, sorting & pagination
 * @query   keyword, category, minPrice, maxPrice, seller (mine), sort, page, limit
 * @access  Public
 */
const getProducts = async (req, res) => {
  const {
    keyword = '',
    category = '',
    minPrice,
    maxPrice,
    seller = '',
    sort = '-createdAt',
    includeInactive = '',
  } = req.query;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit) || 12));

  const filter = {};

  // Hide inactive products from public browsing (admin/sales management views pass includeInactive=1)
  if (includeInactive !== '1' || !['admin', 'sales'].includes(req.user?.role)) {
    filter.isActive = true;
  }

  if (keyword) {
    filter.$or = [
      { name: { $regex: escapeRegex(keyword), $options: 'i' } },
      { description: { $regex: escapeRegex(keyword), $options: 'i' } },
      { brand: { $regex: escapeRegex(keyword), $options: 'i' } },
      { category: { $regex: escapeRegex(keyword), $options: 'i' } },
    ];
  }
  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (seller === 'mine' && req.user) filter.seller = req.user._id;
  else if (seller && mongoose.isValidObjectId(seller)) filter.seller = seller;

  const allowedSorts = {
    '-createdAt': '-createdAt',
    newest: '-createdAt',
    oldest: 'createdAt',
    'price-asc': 'price',
    'price-desc': '-price',
    name: 'name',
  };
  const sortBy = allowedSorts[sort] || '-createdAt';

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('seller', 'name email role')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ products, page, pages: Math.ceil(total / limit), total });
};

/**
 * @route   GET /api/products/categories
 * @desc    Distinct category list for filter dropdowns
 * @access  Public
 */
const getCategories = async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  res.json(categories.sort());
};

/**
 * @route   GET /api/products/:id
 * @desc    Single product detail
 * @access  Public
 */
const getProductById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Product not found' });
  const product = await Product.findById(req.params.id).populate('seller', 'name email role');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

/**
 * @route   POST /api/products/upload
 * @desc    Upload image(s) straight to Cloudinary (multer keeps them in memory only).
 *          Returns Cloudinary URLs — the DB stores URLs, never raw files.
 * @access  Private (Admin, Sales)
 */
const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files received' });
    }
    const uploads = await Promise.all(
      req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'ecommerce/products', {
          mimetype: file.mimetype,
          originalName: file.originalname,
        })
      )
    );
    res.status(201).json({ images: uploads }); // [{ url, public_id }]
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/products
 * @desc    Create a product. Admin or Sales Person. The seller is ALWAYS the
 *          authenticated user taken from the JWT — never from the request body.
 * @access  Private (Admin, Sales)
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, brand, stock, images } = req.body;

    if (!name || !description || price === undefined || !category) {
      return res.status(400).json({ message: 'Name, description, price and category are required' });
    }

    const imageList = Array.isArray(images)
      ? images.filter((img) => img && img.url).map((img) => ({ url: img.url, public_id: img.public_id }))
      : [];

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      brand: brand || '',
      stock: Number(stock) || 0,
      images: imageList,
      seller: req.user._id, // ownership from the verified token
    });

    const populated = await product.populate('seller', 'name email role');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product. Admin can update ANY product;
 *          a Sales Person can update ONLY products they own (403 otherwise).
 * @access  Private (Admin, Sales)
 */
const updateProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Product not found' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // ---- Ownership enforcement on the backend ----
    const isOwner = product.seller.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Forbidden — you can only edit products you created' });
    }

    const { name, description, price, category, brand, stock, images, isActive } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (category !== undefined) product.category = category;
    if (brand !== undefined) product.brand = brand;
    if (stock !== undefined) product.stock = Number(stock);
    if (isActive !== undefined && req.user.role === 'admin') product.isActive = Boolean(isActive);
    if (Array.isArray(images)) {
      // Remove deleted images from Cloudinary (best effort)
      const newIds = new Set(images.map((i) => i.public_id).filter(Boolean));
      const removed = product.images.filter((i) => i.public_id && !newIds.has(i.public_id));
      removed.forEach((i) => destroyFromCloudinary(i.public_id));
      product.images = images.filter((img) => img && img.url).map((img) => ({ url: img.url, public_id: img.public_id }));
    }

    const updated = await product.save();
    const populated = await updated.populate('seller', 'name email role');
    res.json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product. Admin can delete ANY product;
 *          a Sales Person can delete ONLY their own (403 otherwise).
 * @access  Private (Admin, Sales)
 */
const deleteProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Product not found' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const isOwner = product.seller.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Forbidden — you can only delete products you created' });
    }

    // Clean up Cloudinary assets (best effort)
    product.images.forEach((img) => img.public_id && destroyFromCloudinary(img.public_id));

    await product.deleteOne();
    res.json({ message: 'Product deleted', _id: req.params.id });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getCategories,
  getProductById,
  uploadImages,
  createProduct,
  updateProduct,
  deleteProduct,
};
