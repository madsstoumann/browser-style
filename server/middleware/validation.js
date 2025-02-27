import { param, query, validationResult } from 'express-validator';

// Validation middleware for different request types
export const validateAssetRequest = (type) => {
  switch (type) {
    case 'get':
      return [
        param('id').isString().trim().notEmpty().withMessage('Asset ID is required'),
        query('width').optional().isInt({ min: 10, max: 5000 }).withMessage('Width must be between 10 and 5000 pixels'),
        query('height').optional().isInt({ min: 10, max: 5000 }).withMessage('Height must be between 10 and 5000 pixels'),
        query('dpi').optional().isInt({ min: 72, max: 600 }).withMessage('DPI must be between 72 and 600'),
        validateResults
      ];
    case 'post':
      return [
        param('id').isString().trim().notEmpty().withMessage('Asset ID is required'),
        query('default').optional().isBoolean().withMessage('Default flag must be a boolean'),
        validateResults
      ];
    case 'list':
      return [
        param('id').isString().trim().notEmpty().withMessage('Folder ID is required'),
        validateResults
      ];
    case 'default':
      return [
        param('id').isString().trim().notEmpty().withMessage('Asset ID is required'),
        param('filename').isString().trim().notEmpty().withMessage('Filename is required'),
        validateResults
      ];
    default:
      return [validateResults];
  }
};

// Helper function to validate results and return errors
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array().map(err => ({ field: err.param, message: err.msg })) 
    });
  }
  next();
};
