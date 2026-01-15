const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
let sharp = null;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp module not available - image compression disabled');
}
const { Document } = require('../../models');
const enterpriseLogger = require('../../utils/logger');

class DocumentService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../../uploads');
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.setupUpload();
  }

  /**
   * Setup multer for file uploads
   */
  setupUpload() {
    this.ensureUploadDir();

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      },
    });

    const fileFilter = (req, file, cb) => {
      if (this.allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    };

    this.upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
      },
    });
  }

  /**
   * Ensure upload directory exists
   */
  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch (error) {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Compress image if applicable
   */
  async compressImage(buffer, mimeType) {
    try {
      if (!sharp) {
        enterpriseLogger.warn('Sharp not available - skipping compression');
        return buffer;
      }

      if (!mimeType.startsWith('image/')) {
        return buffer;
      }

      // Compress and optimize image
      const compressed = await sharp(buffer)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toBuffer();

      const originalSize = buffer.length;
      const compressedSize = compressed.length;
      const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

      enterpriseLogger.info('Image compressed', {
        originalSize,
        compressedSize,
        savingsPercent: savings,
      });

      return compressed;
    } catch (error) {
      enterpriseLogger.warn('Image compression failed, using original', { error: error.message });
      return buffer;
    }
  }

  /**
   * Generate thumbnail for images
   */
  async generateThumbnail(buffer, mimeType) {
    try {
      if (!mimeType.startsWith('image/')) {
        return null;
      }

      const thumbnail = await sharp(buffer)
        .resize(200, 200, {
          fit: 'cover',
        })
        .jpeg({
          quality: 80,
        })
        .toBuffer();

      return thumbnail;
    } catch (error) {
      enterpriseLogger.warn('Thumbnail generation failed', { error: error.message });
      return null;
    }
  }

  /**
   * Upload document
   */
  async uploadDocument(file, metadata = {}) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Compress image if enabled and applicable
      const enableCompression = process.env.ENABLE_IMAGE_COMPRESSION !== 'false';
      let processedFile = file;

      if (enableCompression && file.mimetype.startsWith('image/')) {
        try {
          const fileBuffer = await fs.readFile(file.path);
          const compressedBuffer = await this.compressImage(fileBuffer, file.mimetype);

          // Save compressed version
          await fs.writeFile(file.path, compressedBuffer);
          processedFile = {
            ...file,
            size: compressedBuffer.length,
          };

          // Generate and save thumbnail
          const thumbnail = await this.generateThumbnail(compressedBuffer, file.mimetype);
          if (thumbnail) {
            const thumbnailPath = file.path.replace(/(\.[^.]+)$/, '-thumb$1');
            await fs.writeFile(thumbnailPath, thumbnail);
          }
        } catch (compressionError) {
          enterpriseLogger.warn('Compression failed, using original file', {
            error: compressionError.message,
          });
        }
      }

      const document = await Document.create({
        userId: metadata.userId,
        filingId: metadata.filingId || null,
        memberId: metadata.memberId || null,
        category: metadata.category || 'OTHER',
        filename: processedFile.filename,
        originalFilename: processedFile.originalname,
        localPath: processedFile.path,
        mimeType: processedFile.mimetype,
        sizeBytes: processedFile.size,
        uploadedBy: metadata.userId,
      });

      enterpriseLogger.info('Document uploaded and saved to DB', {
        documentId: document.id,
        userId: metadata.userId,
        compressed: enableCompression && file.mimetype.startsWith('image/'),
      });

      return {
        success: true,
        document,
      };
    } catch (error) {
      enterpriseLogger.error('Document upload error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId, userId) {
    try {
      const document = await Document.findOne({
        where: { id: documentId, userId, isDeleted: false },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      return document;
    } catch (error) {
      enterpriseLogger.error('Get document error', { documentId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId, userId) {
    try {
      const document = await Document.findOne({
        where: { id: documentId, userId, isDeleted: false },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      await document.softDelete(userId);

      return { success: true };
    } catch (error) {
      enterpriseLogger.error('Document deletion error', { documentId, error: error.message });
      throw error;
    }
  }

  /**
   * List documents
   */
  async listDocuments(userId, filters = {}) {
    try {
      const whereClause = {
        userId,
        isDeleted: false,
      };

      if (filters.category) {
        whereClause.category = filters.category;
      }

      if (filters.filingId) {
        whereClause.filingId = filters.filingId;
      }

      if (filters.memberId) {
        whereClause.memberId = filters.memberId;
      }

      if (filters.financialYear) {
        whereClause.financialYear = filters.financialYear;
      }

      const documents = await Document.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
      });

      return documents;
    } catch (error) {
      enterpriseLogger.error('List documents error', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(userId) {
    try {
      const stats = await Document.getUserStorageStats(userId);
      const limit = 100 * 1024 * 1024; // 100MB limit

      return {
        ...stats,
        maxStorageBytes: limit,
        storageUsedPercentage: Math.round((stats.totalSize / limit) * 100),
      };
    } catch (error) {
      enterpriseLogger.error('Get document stats error', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get Multer middleware
   */
  getUploadMiddleware(fieldName = 'file') {
    return this.upload.single(fieldName);
  }
}

module.exports = new DocumentService();
