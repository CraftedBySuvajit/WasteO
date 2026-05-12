const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET,
});

const isCloudinaryConfigured = () => {
  const cfg = cloudinary.config();
  return !!(cfg.cloud_name && cfg.api_key && cfg.api_secret);
};

module.exports = cloudinary;
module.exports.isCloudinaryConfigured = isCloudinaryConfigured;