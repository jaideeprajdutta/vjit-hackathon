const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const database = require('../config/database');

class FileController {
  // Upload files for a grievance
  async uploadFiles(req, res) {
    try {
      const { grievanceId, description } = req.body;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          error: 'No files uploaded',
          code: 'NO_FILES'
        });
      }

      const uploadedFiles = req.files.map(file => {
        const fileInfo = {
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          grievanceId: grievanceId,
          description: description || ''
        };
        
        return database.addFileMetadata(fileInfo);
      });

      // Update grievance with file references
      let grievance = database.getGrievance(grievanceId);
      if (!grievance) {
        grievance = database.createGrievance({
          id: grievanceId,
          title: 'File Upload',
          description: 'Files uploaded without grievance form'
        });
      }
      
      const currentFiles = grievance.files || [];
      database.updateGrievance(grievanceId, {
        files: [...currentFiles, ...uploadedFiles.map(f => f.id)]
      });

      res.json({
        success: true,
        message: 'Files uploaded successfully',
        files: uploadedFiles.map(f => ({
          id: f.id,
          originalName: f.originalName,
          size: f.size,
          mimetype: f.mimetype,
          uploadDate: f.uploadDate
        }))
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: 'File upload failed',
        code: 'UPLOAD_FAILED'
      });
    }
  }

  // Get file metadata for a grievance
  async getFiles(req, res) {
    try {
      const { grievanceId } = req.params;
      const files = database.getFilesByGrievanceId(grievanceId);
      
      const fileList = files.map(file => ({
        id: file.id,
        originalName: file.originalName,
        size: file.size,
        mimetype: file.mimetype,
        uploadDate: file.uploadDate,
        description: file.description
      }));

      res.json({ files: fileList });
    } catch (error) {
      console.error('Get files error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve files',
        code: 'RETRIEVAL_FAILED'
      });
    }
  }

  // Download file
  async downloadFile(req, res) {
    try {
      const { fileId } = req.params;
      const file = database.getFileMetadata(fileId);
      
      if (!file) {
        return res.status(404).json({ 
          error: 'File not found',
          code: 'FILE_NOT_FOUND'
        });
      }

      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ 
          error: 'File not found on disk',
          code: 'FILE_NOT_ON_DISK'
        });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimetype);
      
      const fileStream = fs.createReadStream(file.path);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ 
        error: 'File download failed',
        code: 'DOWNLOAD_FAILED'
      });
    }
  }

  // Delete file
  async deleteFile(req, res) {
    try {
      const { fileId } = req.params;
      const file = database.getFileMetadata(fileId);
      
      if (!file) {
        return res.status(404).json({ 
          error: 'File not found',
          code: 'FILE_NOT_FOUND'
        });
      }

      // Remove file from disk
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Remove from grievance
      const grievance = database.getGrievance(file.grievanceId);
      if (grievance) {
        const updatedFiles = grievance.files.filter(id => id !== fileId);
        database.updateGrievance(file.grievanceId, { files: updatedFiles });
      }

      // Remove metadata
      database.deleteFileMetadata(fileId);

      res.json({ 
        success: true, 
        message: 'File deleted successfully' 
      });
      
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ 
        error: 'File deletion failed',
        code: 'DELETE_FAILED'
      });
    }
  }

  // Get file preview (for images)
  async previewFile(req, res) {
    try {
      const { fileId } = req.params;
      const file = database.getFileMetadata(fileId);
      
      if (!file) {
        return res.status(404).json({ 
          error: 'File not found',
          code: 'FILE_NOT_FOUND'
        });
      }

      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ 
          error: 'File is not an image',
          code: 'NOT_AN_IMAGE'
        });
      }

      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ 
          error: 'File not found on disk',
          code: 'FILE_NOT_ON_DISK'
        });
      }

      res.setHeader('Content-Type', file.mimetype);
      const fileStream = fs.createReadStream(file.path);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('Preview error:', error);
      res.status(500).json({ 
        error: 'File preview failed',
        code: 'PREVIEW_FAILED'
      });
    }
  }
}

module.exports = new FileController();