const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

/**
 * A value only counts as "configured" when it is a real key — blank strings and
 * template placeholders from .env.example (your_cloud_name, xxxx…) are ignored.
 * Without this, copying .env.example → .env makes the server call Cloudinary
 * with fake keys and every upload fails with "Unknown API key".
 */
const isRealValue = (v) => {
  const s = String(v || '').trim();
  if (!s) return false;
  if (/^(your_|change_|replace_|xxxx|placeholder)/i.test(s)) return false;
  return true;
};

const hasCloudinaryConfig =
  isRealValue(process.env.CLOUDINARY_CLOUD_NAME) &&
  isRealValue(process.env.CLOUDINARY_API_KEY) &&
  isRealValue(process.env.CLOUDINARY_API_SECRET);

/**
 * DEMO IMAGE STORAGE (dev only)
 * -----------------------------
 * When Cloudinary keys are absent, uploaded images are written to
 * backend/uploads/ and served by Express at /api/uploads/<file>, so the whole
 * product-image flow works with zero third-party accounts. In production the
 * keys are REQUIRED and the old explicit 503 is returned.
 */
const demoUploadsEnabled = !hasCloudinaryConfig && process.env.NODE_ENV !== 'production';
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const DEMO_PUBLIC_PREFIX = 'local_demo/';

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload an image buffer (from multer memory storage).
 * Real Cloudinary when configured; otherwise the local demo store (dev only).
 * The DB stores only URLs — never raw files.
 * @param {Buffer} buffer
 * @param {string} folder
 * @param {{mimetype?: string, originalName?: string}} meta file info from multer
 * @returns {Promise<{url: string, public_id: string}>}
 */
const uploadToCloudinary = (buffer, folder = 'ecommerce/products', meta = {}) =>
  new Promise((resolve, reject) => {
    // ---- Real Cloudinary ----
    if (hasCloudinaryConfig) {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', overwrite: false },
        (error, result) => {
          if (error) return reject(error);
          resolve({ url: result.secure_url, public_id: result.public_id });
        }
      );
      stream.end(buffer);
      return;
    }

    // ---- Local demo storage ----
    if (demoUploadsEnabled) {
      try {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        const MIME_EXT = {
          'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp',
          'image/gif': '.gif', 'image/avif': '.avif',
        };
        const fromName = String(path.extname(meta.originalName || '')).toLowerCase();
        const safeExt =
          MIME_EXT[meta.mimetype] ||
          (/^\.(png|jpe?g|webp|gif|avif)$/.test(fromName) ? fromName : '.jpg');
        const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`;
        fs.writeFileSync(path.join(UPLOADS_DIR, name), buffer);
        resolve({ url: `/api/uploads/${name}`, public_id: `${DEMO_PUBLIC_PREFIX}${name}` });
      } catch (err) {
        reject(Object.assign(new Error(`Demo image storage failed: ${err.message}`), { statusCode: 500 }));
      }
      return;
    }

    reject(
      Object.assign(
        new Error('Cloudinary is not configured on this server. Add real CLOUDINARY_* variables to .env (placeholder values are ignored)'),
        { statusCode: 503 }
      )
    );
  });

/** Best-effort removal of an image — Cloudinary by public_id, or the local demo file. */
const destroyFromCloudinary = async (publicId) => {
  if (!publicId) return;
  // local demo file
  if (String(publicId).startsWith(DEMO_PUBLIC_PREFIX)) {
    try {
      const file = path.join(UPLOADS_DIR, path.basename(String(publicId).slice(DEMO_PUBLIC_PREFIX.length)));
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch (err) {
      console.warn('[uploads] local destroy failed:', err.message);
    }
    return;
  }
  if (!hasCloudinaryConfig) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('[cloudinary] destroy failed:', err.message);
  }
};

module.exports = { cloudinary, hasCloudinaryConfig, demoUploadsEnabled, uploadToCloudinary, destroyFromCloudinary };
