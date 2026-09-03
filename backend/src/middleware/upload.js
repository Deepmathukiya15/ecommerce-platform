const multer = require('multer');

/**
 * Images are held in MEMORY only (never written to the server disk)
 * and streamed directly to Cloudinary by the upload controller.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Only image files are allowed (jpg, png, webp, gif)'), { statusCode: 400 }), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per image
});

module.exports = upload;
