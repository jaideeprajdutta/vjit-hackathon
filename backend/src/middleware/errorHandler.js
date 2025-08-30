const multer = require('multer');

const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 10MB.',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files. Maximum is 5 files per upload.',
        code: 'TOO_MANY_FILES'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  res.status(500).json({ 
    error: error.message || 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};

module.exports = errorHandler;