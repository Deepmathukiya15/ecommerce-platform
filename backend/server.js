require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const connectDB = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const wishlistRoutes = require('./src/routes/wishlistRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const userRoutes = require('./src/routes/userRoutes');
const statsRoutes = require('./src/routes/statsRoutes');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // In development, if no MONGO_URI is provided, spin up a file-backed MongoDB
  // (data lives in .mongodb-data/ and SURVIVES server restarts, so registered
  // accounts & sessions never vanish) — the project runs out-of-the-box.
  let mongoUri = process.env.MONGO_URI;
  if (!mongoUri && process.env.NODE_ENV !== 'production') {
    const fs = require('fs');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = require('path').join(__dirname, '..', '.mongodb-data');
    fs.mkdirSync(dbPath, { recursive: true });
    const memServer = await MongoMemoryServer.create({
      instance: { dbName: 'ecommerce', dbPath, storageEngine: 'wiredTiger' },
    });
    mongoUri = memServer.getUri('ecommerce');
    console.log('[db] No MONGO_URI set — using persistent file-backed dev MongoDB at', dbPath);
  }
  await connectDB(mongoUri);

  // Development convenience: auto-seed demo users/products on an empty DB
  if (process.env.NODE_ENV !== 'production' && process.env.AUTO_SEED !== 'false') {
    const { seedDatabase } = require('./src/config/seedData');
    await seedDatabase();
  }

  const app = express();

  // CORS
  //  • development / sandbox previews (Vercel-style tunnels, e2b popup, localhost):
  //    allow ANY origin so the live preview popup never hits "Not allowed by CORS"
  //  • production: strict allow-list from CLIENT_URL (your Vercel URL)
  const allowedOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin(origin, callback) {
        if (process.env.NODE_ENV !== 'production') return callback(null, true); // dev/preview: open
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token'],

    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check (used by Render / uptime monitors)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ecommerce-api', time: new Date().toISOString() });
  });

  // API routes
  // Demo image storage (dev fallback when Cloudinary keys are absent)
  app.use('/api/uploads', express.static(require('path').join(__dirname, 'uploads')));

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', statsRoutes);

  // Serve built frontend in production (single-service deploys)
  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(__dirname, '..', 'frontend', 'dist');
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] API running on http://0.0.0.0:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
