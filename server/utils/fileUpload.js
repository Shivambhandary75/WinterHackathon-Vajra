const multer = require('multer');
const path = require('path');
const { getBucket } = require('../config/firebase');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV, AVI, WebM) are allowed.'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

/**
 * Upload file to Firebase Storage
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} originalName - Original filename
 * @param {String} mimetype - File MIME type
 * @param {String} folder - Storage folder (reports, profiles, etc.)
 * @returns {Promise<String>} Public URL of uploaded file
 */
const uploadToFirebase = async (fileBuffer, originalName, mimetype, folder = 'reports') => {
  try {
    const bucket = getBucket();
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = path.extname(originalName);
    const filename = `${folder}/${timestamp}_${randomString}${extension}`;

    // Create file reference
    const file = bucket.file(filename);

    // Upload file
    await file.save(fileBuffer, {
      metadata: {
        contentType: mimetype,
        metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString()
        }
      },
      public: true, // Make file publicly accessible
      resumable: false
    });

    // Make the file public
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    console.log(`✅ File uploaded successfully: ${filename}`);
    return publicUrl;

  } catch (error) {
    console.error('❌ Firebase upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload multiple files to Firebase Storage
 * @param {Array} files - Array of file objects from multer
 * @param {String} folder - Storage folder
 * @returns {Promise<Array>} Array of public URLs
 */
const uploadMultipleToFirebase = async (files, folder = 'reports') => {
  try {
    const uploadPromises = files.map(file => 
      uploadToFirebase(file.buffer, file.originalname, file.mimetype, folder)
    );
    
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('❌ Multiple files upload error:', error);
    throw error;
  }
};

/**
 * Delete file from Firebase Storage
 * @param {String} fileUrl - Public URL of the file
 * @returns {Promise<Boolean>} Success status
 */
const deleteFromFirebase = async (fileUrl) => {
  try {
    const bucket = getBucket();
    
    // Extract filename from URL
    const urlParts = fileUrl.split(`${bucket.name}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid file URL');
    }
    
    const filename = decodeURIComponent(urlParts[1]);
    
    // Delete file
    await bucket.file(filename).delete();
    
    console.log(`✅ File deleted successfully: ${filename}`);
    return true;
  } catch (error) {
    console.error('❌ Firebase delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Get file metadata from Firebase Storage
 * @param {String} fileUrl - Public URL of the file
 * @returns {Promise<Object>} File metadata
 */
const getFileMetadata = async (fileUrl) => {
  try {
    const bucket = getBucket();
    const urlParts = fileUrl.split(`${bucket.name}/`);
    const filename = decodeURIComponent(urlParts[1]);
    
    const file = bucket.file(filename);
    const [metadata] = await file.getMetadata();
    
    return {
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType,
      created: metadata.timeCreated,
      updated: metadata.updated
    };
  } catch (error) {
    console.error('❌ Get metadata error:', error);
    throw error;
  }
};

module.exports = {
  upload,
  uploadToFirebase,
  uploadMultipleToFirebase,
  deleteFromFirebase,
  getFileMetadata
};
