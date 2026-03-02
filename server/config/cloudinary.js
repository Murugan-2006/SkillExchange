import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Ensure .env is loaded even if this module is imported before server's dotenv.config()
dotenv.config();

// Remove possible surrounding quotes from .env values (in case they were added)
const cloudName = (process.env.CLOUDINARY_NAME || '').replace(/(^\"|\"$)/g, '');
const apiKey = (process.env.CLOUDINARY_API_KEY || '').replace(/(^\"|\"$)/g, '');
const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').replace(/(^\"|\"$)/g, '');

// Ensure Cloudinary will accept raw uploads
if (!cloudName || !apiKey || !apiSecret) {
  console.warn('Cloudinary credentials are missing or invalid. Check your .env variables (CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).');
} else {
  console.log('Cloudinary configured for:', cloudName);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('Cloudinary credentials are missing or invalid. Check your .env variables (CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).');
}

export default cloudinary;
