const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { isCloudinaryConfigured } = require("../config/cloudinary");

// ─── Use memoryStorage (works on Render, Heroku, etc.) ───
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (allowed.test(file.mimetype.split("/")[1])) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, jpeg, png, gif, webp) are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const ensureUploadsDir = () => {
  const uploadsDir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

const getFileExtension = (file) => {
  if (!file?.mimetype) return "bin";
  const ext = file.mimetype.split("/")[1] || "bin";
  return ext.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
};

const saveFileLocally = (file) => {
  const uploadsDir = ensureUploadsDir();
  const extension = getFileExtension(file);
  const fileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
  const fullPath = path.join(uploadsDir, fileName);
  fs.writeFileSync(fullPath, file.buffer);
  return `/uploads/${fileName}`;
};

/**
 * Upload a multer memoryStorage file buffer to Cloudinary via streamifier.
 * Returns the secure_url string on success.
 * Includes full diagnostics for production debugging.
 */
const uploadToCloudinary = (file, folder = "wasteo") => {
  return new Promise((resolve, reject) => {
    // ── Pre-flight check: file buffer ──
    if (!file || !file.buffer) {
      console.error("❌ [CLOUDINARY] No file buffer provided");
      return reject(new Error("No file buffer provided for Cloudinary upload"));
    }

    console.log(`☁️ [UPLOAD] Starting upload | folder=${folder} | size=${file.buffer.length} bytes | mime=${file.mimetype}`);

    if (!isCloudinaryConfigured()) {
      try {
        const localUrl = saveFileLocally(file);
        console.log(`📁 [UPLOAD] Cloudinary not configured. Saved locally: ${localUrl}`);
        return resolve(localUrl);
      } catch (localErr) {
        console.error("❌ [UPLOAD] Local fallback failed:", localErr.message);
        return reject(new Error(`Local upload failed: ${localErr.message}`));
      }
    }

    // ── Upload stream (no format restriction — let Cloudinary auto-detect) ──
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) {
          console.error("❌ [CLOUDINARY] upload_stream error:", JSON.stringify(error));
          return reject(new Error(`Cloudinary error: ${error.message || JSON.stringify(error)}`));
        }
        if (!result || !result.secure_url) {
          console.error("❌ [CLOUDINARY] No secure_url in result:", JSON.stringify(result));
          return reject(new Error("Cloudinary returned no URL"));
        }
        console.log(`✅ [UPLOAD] Cloudinary upload OK: ${result.secure_url}`);
        resolve(result.secure_url);
      }
    );

    // ── Handle stream errors ──
    stream.on("error", (streamErr) => {
      console.error("❌ [CLOUDINARY] Stream error:", streamErr.message);
      reject(new Error(`Cloudinary stream error: ${streamErr.message}`));
    });

    // Use streamifier for reliable buffer-to-stream piping on all platforms
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

module.exports = upload;
module.exports.uploadToCloudinary = uploadToCloudinary;
