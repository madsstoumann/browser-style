import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure storage with improved directory structure
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Extract SKU from the request params
    const sku = req.params.id;
    
    // Create an improved directory structure based on SKU chunks
    // For sku "123456": /assets/12/34/56/123456/
    const chunkedPath = [];
    
    // Process SKU in chunks of 2 characters
    for (let i = 0; i < sku.length; i += 2) {
      if (i + 2 <= sku.length) {
        // Get each 2-character chunk
        chunkedPath.push(sku.substring(i, i + 2));
      } else if (i < sku.length) {
        // Handle odd-length SKUs by padding the last char with 0
        chunkedPath.push(sku.substring(i) + '0');
      }
    }
    
    // If SKU is too short, pad with leading directories
    // but don't add more than 3 total levels
    while (chunkedPath.length > 0 && chunkedPath.length < 3) {
      chunkedPath.unshift('00');
    }
    
    // Add the full SKU as the final directory
    const dirPath = [...chunkedPath, sku];
    const dir = path.join('assets', ...dirPath);
    
    // Create the directory if it doesn't exist
    fs.mkdirSync(dir, { recursive: true });
    
    // Log the directory structure for debugging
    console.log(`Storing files for SKU ${sku} in: ${dir}`);
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    
    // Create filename with original name and unique suffix
    cb(null, file.originalname.replace(extension, '') + '-' + uniqueSuffix + extension);
  }
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
  
  // Check extension and mimetype
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('File type not supported. Allowed types: images, PDF, Word, Excel'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

export { upload };
