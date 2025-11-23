// =====================================================
// UNIFIED FILE STORAGE SERVICE (S3 + FILE UPLOAD)
// Handles S3 interactions: presigned URLs, uploads, downloads
// Integrated file upload validation and processing
// Supports local fallback for development
// =====================================================

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuid_generate_v4 } = require('uuid');
const { AppError } = require('../middleware/errorHandler');
const enterpriseLogger = require('../utils/logger');
const featureFlags = require('../common/featureFlags');

const UPLOAD_DIR_LOCAL = path.join(__dirname, '../../uploads/local');
fs.ensureDirSync(UPLOAD_DIR_LOCAL); // Ensure local upload directory exists

class S3Service {
  constructor() {
    this.isS3Enabled = featureFlags.isEnabled('FEATURE_DOCUMENT_S3');

    // File upload configuration
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
    };

    if (this.isS3Enabled) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'burnblack-documents';
      enterpriseLogger.info('Unified File Storage Service initialized with AWS S3', { bucket: this.bucketName, region: process.env.AWS_REGION });
    } else {
      enterpriseLogger.warn('Unified File Storage Service initialized with LOCAL FILE SYSTEM fallback (FEATURE_DOCUMENT_S3 is disabled)');
    }

    this.setupMulter();
  }

  /**
   * Setup multer middleware for file uploads
   */
  setupMulter() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(UPLOAD_DIR_LOCAL, 'temp');
        fs.ensureDirSync(uploadPath);
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuid_generate_v4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req, file, cb) => {
      if (this.allowedTypes[file.mimetype]) {
        cb(null, true);
      } else {
        cb(new AppError(`File type ${file.mimetype} is not allowed`, 400), false);
      }
    };

    this.upload = multer({
      storage: storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 10 // Max 10 files per request
      },
      fileFilter: fileFilter
    });
  }

  /**
   * Generates a presigned URL for uploading a file to S3.
   * @param {string} userId - The ID of the user uploading the file.
   * @param {string} originalFilename - The original name of the file.
   * @param {string} mimeType - The MIME type of the file.
   * @param {number} sizeBytes - The size of the file in bytes.
   * @param {string} category - The document category.
   * @returns {Promise<{uploadUrl: string, key: string}>} - The presigned URL and S3 key.
   */
  async generatePresignedUploadUrl(userId, originalFilename, mimeType, sizeBytes, category) {
    if (!this.isS3Enabled) {
      // Fallback to local storage for development
      const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(originalFilename)}`;
      const localPath = path.join(UPLOAD_DIR_LOCAL, uniqueFilename);
      enterpriseLogger.info('Generating local upload path', { userId, originalFilename, localPath });
      return {
        uploadUrl: `/api/documents/local-upload`, // A dedicated endpoint for local uploads
        key: uniqueFilename, // Use uniqueFilename as key for local storage
        localPath: localPath,
        isLocal: true,
      };
    }

    const fileExtension = path.extname(originalFilename);
    const key = `users/${userId}/${category}/${uuid_generate_v4()}${fileExtension}`; // Unique S3 key

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
      ContentLength: sizeBytes,
      ACL: 'private', // Ensure files are private
      Metadata: {
        userId,
        originalFilename: encodeURIComponent(originalFilename),
        category,
      },
    });

    try {
      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 }); // 5 minutes
      enterpriseLogger.info('Generated S3 presigned upload URL', { userId, key, originalFilename });
      return { uploadUrl, key, isLocal: false };
    } catch (error) {
      enterpriseLogger.error('Failed to generate S3 presigned upload URL', { userId, originalFilename, error: error.message });
      throw new AppError('Failed to generate upload URL', 500);
    }
  }

  /**
   * Generates a presigned URL for downloading a file from S3.
   * @param {string} key - The S3 key of the file.
   * @param {string} originalFilename - The original name of the file for download.
   * @returns {Promise<string>} - The presigned download URL.
   */
  async generatePresignedDownloadUrl(key, originalFilename) {
    if (!this.isS3Enabled) {
      // Fallback for local storage
      const localPath = path.join(UPLOAD_DIR_LOCAL, key); // Assuming key is the unique filename for local
      if (!fs.existsSync(localPath)) {
        throw new AppError('Local file not found', 404);
      }
      // For local, we might serve it directly or via a dedicated endpoint
      return `/api/documents/local-download/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalFilename)}"`,
    });

    try {
      const downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 }); // 5 minutes
      enterpriseLogger.info('Generated S3 presigned download URL', { key, originalFilename });
      return downloadUrl;
    } catch (error) {
      enterpriseLogger.error('Failed to generate S3 presigned download URL', { key, error: error.message });
      throw new AppError('Failed to generate download URL', 500);
    }
  }

  /**
   * Deletes a file from S3.
   * @param {string} key - The S3 key of the file.
   */
  async deleteFile(key) {
    if (!this.isS3Enabled) {
      const localPath = path.join(UPLOAD_DIR_LOCAL, key);
      try {
        await fs.remove(localPath);
        enterpriseLogger.info('Local file deleted successfully', { localPath });
        return;
      } catch (error) {
        enterpriseLogger.error('Failed to delete local file', { localPath, error: error.message });
        throw new AppError(`Failed to delete local file: ${error.message}`, 500);
      }
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      enterpriseLogger.info('S3 file deleted successfully', { key });
    } catch (error) {
      enterpriseLogger.error('Failed to delete S3 file', { key, error: error.message });
      throw new AppError('Failed to delete file from S3', 500);
    }
  }

  /**
   * Uploads a file directly to local storage (used by local-upload endpoint).
   * @param {Buffer} buffer - The file buffer.
   * @param {string} filename - The unique filename to save as.
   * @returns {Promise<string>} The local path where the file was saved.
   */
  async uploadFileToLocal(buffer, filename) {
    const localPath = path.join(UPLOAD_DIR_LOCAL, filename);
    try {
      await fs.writeFile(localPath, buffer);
      enterpriseLogger.info('File uploaded to local storage', { localPath });
      return localPath;
    } catch (error) {
      enterpriseLogger.error('Failed to upload file to local storage', { filename, error: error.message });
      throw new AppError('Failed to save file locally', 500);
    }
  }

  /**
   * Validate uploaded file
   * @param {object} file - File object from multer
   */
  validateFile(file) {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new AppError(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`, 400);
    }

    // Check file type
    if (!this.allowedTypes[file.mimetype]) {
      throw new AppError(`File type ${file.mimetype} is not supported`, 400);
    }

    // Check file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = Object.values(this.allowedTypes);
    if (!allowedExtensions.includes(fileExtension)) {
      throw new AppError(`File extension ${fileExtension} is not allowed`, 400);
    }
  }

  /**
   * Process uploaded file and return metadata
   * @param {object} file - File object from multer
   * @param {string} userId - User ID
   * @param {string} documentType - Document type
   * @param {string} filingId - Optional filing ID
   * @returns {Promise<object>} File metadata
   */
  async processUploadedFile(file, userId, documentType, filingId = null) {
    try {
      // Validate file
      this.validateFile(file);

      // Create file metadata
      const fileMetadata = {
        id: uuid_generate_v4(),
        originalName: file.originalname,
        filename: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        size: file.size,
        documentType: documentType,
        userId: userId,
        filingId: filingId,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded'
      };

      enterpriseLogger.info('File processed successfully', {
        fileId: fileMetadata.id,
        userId,
        documentType,
        fileName: file.originalname,
        fileSize: file.size
      });

      return fileMetadata;
    } catch (error) {
      enterpriseLogger.error('File processing failed', {
        error: error.message,
        userId,
        documentType,
        fileName: file.originalname
      });
      throw error;
    }
  }

  /**
   * Get multer middleware for file uploads
   * @returns {object} Multer middleware
   */
  getMulterMiddleware() {
    return this.upload;
  }

  /**
   * Create file stream for downloads
   * @param {string} filePath - File path
   * @returns {object} File stream
   */
  getFileStream(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new AppError('File not found', 404);
      }
      return fs.createReadStream(filePath);
    } catch (error) {
      enterpriseLogger.error('Failed to create file stream', { error: error.message, filePath });
      throw error;
    }
  }
}

module.exports = new S3Service();