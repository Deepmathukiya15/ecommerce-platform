const User = require('../models/User');
const Product = require('../models/Product');

/**
 * Demo users for all three roles + sample catalogue.
 * Used by both `npm run seed` (standalone) and the dev auto-seed in server.js.
 */
const demoUsers = [
  { name: 'Aarav Mehta', email: 'admin@example.com', password: 'Admin@123', role: 'admin' },
  { name: 'Priya Sharma', email: 'sales@example.com', password: 'Sales@123', role: 'sales' },
  { name: 'Rohan Verma', email: 'sales2@example.com', password: 'Sales@123', role: 'sales' },
  { name: 'Kavya Patel', email: 'user@example.com', password: 'User@123', role: 'user' },
];

const img = (id, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const demoProducts = [
  // ---- Electronics ----
  { name: 'SoundWave Pro Wireless Headphones', description: 'Over-ear Bluetooth 5.3 headphones with active noise cancellation, 40-hour battery life and plush memory-foam ear cushions. Perfect for travel, work and music lovers.', price: 4999, category: 'Electronics', brand: 'SoundWave', stock: 25, email: 'sales@example.com', image: img('photo-1505740420928-5e560c06d30e') },
  { name: 'Aurora Smart Watch S2', description: 'AMOLED always-on display, SpO2 and heart-rate monitoring, 100+ sport modes, 7-day battery and 5ATM water resistance. Pair with iOS and Android.', price: 7499, category: 'Electronics', brand: 'Aurora', stock: 18, email: 'sales@example.com', image: img('photo-1523275335684-37898b6baf30') },
  { name: 'ProBook Air 14" Laptop', description: 'Ultra-slim 14-inch laptop with 16 GB RAM, 512 GB NVMe SSD, backlit keyboard and a stunning 2.8K display. All-day 12-hour battery for work on the go.', price: 89999, category: 'Electronics', brand: 'ProBook', stock: 8, email: 'sales2@example.com', image: img('photo-1517336714731-489689fd1ca8') },
  { name: 'PixelShot DSLR Camera', description: '24.1 MP DSLR with 4K video, dual-pixel autofocus, 18-55mm kit lens and built-in Wi-Fi. Capture photos worth framing.', price: 54999, category: 'Electronics', brand: 'PixelShot', stock: 6, email: 'sales2@example.com', image: img('photo-1526170375885-4d8ecf77b99f') },
  { name: 'EchoBuds Wireless Earbuds', description: 'True wireless earbuds with ENC mic, 30-hour total playtime, low-latency game mode and IPX5 sweat resistance.', price: 2499, category: 'Electronics', brand: 'SoundWave', stock: 40, email: 'admin@example.com', image: img('photo-1583394838336-acd977736f90') },

  // ---- Fashion ----
  { name: 'Classic Runner Sneakers', description: 'Breathable knit upper, cushioned EVA midsole and grippy rubber outsole. Everyday comfort with a sporty look. Available in signature red.', price: 3299, category: 'Fashion', brand: 'StrideX', stock: 30, email: 'sales@example.com', image: img('photo-1542291026-7eec264c27ff') },
  { name: 'Urban Explorer Backpack', description: '28L water-resistant backpack with padded 15.6" laptop sleeve, anti-theft pocket, USB charging port and ergonomic straps.', price: 1899, category: 'Fashion', brand: 'UrbanGear', stock: 22, email: 'sales@example.com', image: img('photo-1553062407-98eeb64c6a62') },
  { name: 'SunShield Aviator Sunglasses', description: 'UV400 polarized lenses in a timeless gold aviator frame. Lightweight, scratch-resistant and comes with a hard case.', price: 1499, category: 'Fashion', brand: 'SunShield', stock: 35, email: 'sales2@example.com', image: img('photo-1572635196237-14b3f281503f') },

  // ---- Books ----
  { name: 'The Art of Focus (Paperback)', description: 'A bestselling productivity guide on building deep-work habits, beating distraction and doing more of what matters. 320 pages.', price: 399, category: 'Books', brand: 'Clarion Press', stock: 50, email: 'sales2@example.com', image: img('photo-1544947950-fa07a98d237f') },
  { name: 'Modern Web Development Handbook', description: 'From HTML to deployment — a practical handbook covering JavaScript, React, Node.js, MongoDB and cloud hosting with 40+ projects.', price: 899, category: 'Books', brand: 'TechMint', stock: 28, email: 'admin@example.com', image: img('photo-1507842217343-583bb7270b66') },

  // ---- Sports ----
  { name: 'IronGrip Adjustable Dumbbell Set', description: '2 x 20kg adjustable dumbbells with anti-slip chrome handles and weight plates. Home-gym essential for strength training.', price: 5999, category: 'Sports', brand: 'IronGrip', stock: 12, email: 'sales@example.com', image: img('photo-1571019613454-1cb2f99b2d8b') },
  { name: 'CourtPro Basketball (Size 7)', description: 'Official size and weight outdoor basketball with deep-channel pebbled rubber for superior grip and durability.', price: 899, category: 'Sports', brand: 'CourtPro', stock: 45, email: 'sales2@example.com', image: img('photo-1519861531473-9200262188bf') },

  // ---- Home & Kitchen ----
  { name: 'BrewMaster Coffee Maker', description: '10-cup drip coffee maker with programmable timer, reusable filter, keep-warm plate and a glass carafe. Wake up to fresh coffee.', price: 3499, category: 'Home & Kitchen', brand: 'BrewMaster', stock: 15, email: 'admin@example.com', image: img('photo-1517668808822-9ebb02f2a0e6') },
  { name: 'ChefEdge Knife Set', description: '6-piece stainless-steel knife set with ergonomic handles and a wooden block — chef knife, santoku, bread knife, utility, paring and scissors.', price: 2799, category: 'Home & Kitchen', brand: 'ChefEdge', stock: 4, email: 'sales@example.com', image: img('photo-1593618998160-e34014e67546') },

  // ---- Beauty ----
  { name: 'GlowAura Perfume — Eau de Parfum', description: 'A long-lasting 100ml fragrance with notes of citrus, jasmine and sandalwood. Elegant bottle, all-day freshness.', price: 2199, category: 'Beauty', brand: 'GlowAura', stock: 26, email: 'sales2@example.com', image: img('photo-1541643600914-78b084683601') },
  { name: 'PureSkin Vitamin-C Face Serum', description: '30ml brightening serum with 10% vitamin C, hyaluronic acid and niacinamide. Dermatologically tested, cruelty free.', price: 649, category: 'Beauty', brand: 'PureSkin', stock: 60, email: 'sales@example.com', image: img('photo-1620916566398-39f1143ab7be') },
];

/**
 * Seed users + products if the database is empty.
 * Idempotent: skips anything that already exists.
 */
async function seedDatabase({ force = false } = {}) {
  if (force) {
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      require('../models/Cart').deleteMany({}),
      require('../models/Wishlist').deleteMany({}),
      require('../models/Order').deleteMany({}),
    ]);
  }

  const userCount = await User.countDocuments();
  const emailToId = {};

  if (userCount === 0) {
    const created = await User.create(demoUsers); // password hashing happens in the model hook
    created.forEach((u) => (emailToId[u.email] = u._id));
    console.log(`[seed] Created ${created.length} demo users`);
  } else {
    const existing = await User.find({ email: { $in: demoUsers.map((u) => u.email) } });
    existing.forEach((u) => (emailToId[u.email] = u._id));
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    const docs = demoProducts.map(({ email, image, ...p }) => ({
      ...p,
      images: [{ url: image }],
      seller: emailToId[email],
    }));
    await Product.create(docs);
    console.log(`[seed] Created ${docs.length} demo products`);
  }

  return { emailToId };
}

module.exports = { seedDatabase, demoUsers, demoProducts };
