const { upload, uploadToFirebase, uploadMultipleToFirebase, deleteFromFirebase, getFileMetadata } = require('../utils/fileUpload');

/**
 * @desc    Upload single file
 * @route   POST /api/upload/single
 * @access  Private
 */
const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const folder = req.body.folder || 'reports';
    const url = await uploadToFirebase(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      url
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Upload multiple files
 * @route   POST /api/upload/multiple
 * @access  Private
 */
const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const folder = req.body.folder || 'reports';
    const urls = await uploadMultipleToFirebase(req.files, folder);

    res.status(200).json({
      success: true,
      message: `${urls.length} file(s) uploaded successfully`,
      urls,
      count: urls.length
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete file
 * @route   DELETE /api/upload
 * @access  Private
 */
const deleteFile = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }

    await deleteFromFirebase(url);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get file metadata
 * @route   GET /api/upload/metadata
 * @access  Private
 */
const getMetadata = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }

    const metadata = await getFileMetadata(url);

    res.status(200).json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error('Metadata error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  getMetadata
};
