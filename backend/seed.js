/**
 * Standalone seed script — populates MongoDB with demo users (all 3 roles)
 * and a sample product catalogue.
 *
 * Usage:
 *   node seed.js              # seed if empty
 *   node seed.js --destroy    # wipe all data first, then seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const { seedDatabase } = require('./src/config/seedData');

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[seed] MONGO_URI is required (in-memory DB from the dev server cannot be seeded externally).');
    process.exit(1);
  }
  await connectDB(uri);
  await seedDatabase({ force: process.argv.includes('--destroy') });
  console.log('[seed] Done. Test logins:');
  console.log('  Admin         → admin@example.com  / Admin@123');
  console.log('  Sales Person  → sales@example.com  / Sales@123');
  console.log('  Sales Person2 → sales2@example.com / Sales@123');
  console.log('  User          → user@example.com   / User@123');
  await mongoose.disconnect();
  process.exit(0);
})();
