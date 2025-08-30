const express = require('express');
const { upload } = require('../config/multer');
const fileController = require('../controllers/fileController');

const router = express.Router();

// Upload files for a grievance
router.post('/upload', upload.array('files', 5), fileController.uploadFiles);

// Get file metadata for a grievance
router.get('/:grievanceId', fileController.getFiles);

// Download file
router.get('/download/:fileId', fileController.downloadFile);

// Delete file
router.delete('/:fileId', fileController.deleteFile);

// Get file preview (for images)
router.get('/preview/:fileId', fileController.previewFile);

module.exports = router;