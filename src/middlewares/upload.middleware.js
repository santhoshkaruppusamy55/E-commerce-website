const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const path = require("path");

// S3 Client – uses IAM role on EB (no keys needed)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
});

// Use memory storage for sharp processing
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG images are allowed"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB max for original upload
  }
});

// Middleware to resize and upload to S3
const processAndUpload = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const uploadPromises = req.files.map(async (file) => {
      let uploadBuffer = file.buffer;
      let contentType = file.mimetype;

      // Try to use sharp if available, otherwise upload original
      try {
        // Resize image to 800x800 with sharp
        uploadBuffer = await sharp(file.buffer)
          .resize(800, 800, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 85 })
          .toBuffer();
        contentType = 'image/jpeg';
      } catch (sharpError) {
        console.warn('Sharp processing failed, uploading original:', sharpError.message);
        // Use original buffer if sharp fails
      }

      // Generate unique filename
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const key = `products/${uniqueName}`;

      // Upload to S3
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: uploadBuffer,
        ContentType: contentType,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      // Add S3 location to file object
      file.location = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
      file.key = key;
    });

    await Promise.all(uploadPromises);
    next();
  } catch (error) {
    console.error('Upload middleware error:', error);
    next(error);
  }
};

module.exports = { upload, processAndUpload };
