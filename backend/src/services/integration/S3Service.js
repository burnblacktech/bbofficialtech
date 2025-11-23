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

    if (this.isS3Enabled) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'burnblack-documents';
      enterpriseLogger.info('S3Service initialized with AWS S3', { bucket: this.bucketName, region: process.env.AWS_REGION });
    } else {
      enterpriseLogger.warn('S3Service initialized with LOCAL FILE SYSTEM fallback (FEATURE_DOCUMENT_S3 is disabled)');
    }
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
}

module.exports = new S3Service();