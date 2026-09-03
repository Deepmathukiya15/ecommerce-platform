const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

const WISHLIST_POPULATE = {
  path: 'products',
  select: 'name price images stock category seller isActive',
};

const ensureWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
};

/**
 * @route   GET /api/wishlist
 * @access  Private
 */
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await ensureWishlist(req.user._id);
    await wishlist.populate(WISHLIST_POPULATE);
    res.json(wishlist);
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/wishlist
 * @body    { productId }
 * @access  Private
 */
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const wishlist = await ensureWishlist(req.user._id);
    const exists = wishlist.products.some((p) => p.toString() === product._id.toString());
    if (exists) return res.status(400).json({ message: 'Product is already in your wishlist' });

    wishlist.products.push(product._id);
    await wishlist.save();
    await wishlist.populate(WISHLIST_POPULATE);
    res.status(201).json(wishlist);
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/wishlist/:productId
 * @access  Private
 */
const removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await ensureWishlist(req.user._id);
    wishlist.products = wishlist.products.filter((p) => p.toString() !== req.params.productId);
    await wishlist.save();
    await wishlist.populate(WISHLIST_POPULATE);
    res.json(wishlist);
  } catch (err) {
    next(err);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
