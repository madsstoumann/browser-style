import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

/**
 * Middleware to handle image resizing from direct URLs with width parameter
 * Example: /assets/12/34/56/123456/image.jpeg?w=200
 */
export const imageResizeMiddleware = async (req, res, next) => {
  console.log('Image resize middleware called for path:', req.path);
  console.log('Query parameters:', req.query);
  
  // Only process if there's a 'w' or 'h' query parameter
  if (!req.query.w && !req.query.h) {
    console.log('No resize parameters found, skipping resize');
    return next();
  }

  try {
    // The req.path doesn't include the '/assets' prefix that was used in app.use()
    // We need to add it back when constructing the file path
    const assetPath = path.join('assets', req.path);
    const filePath = path.join(process.cwd(), assetPath);
    
    console.log('Looking for file at:', filePath);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return next();
    }
    
    // Check if it's a resizable image format
    const ext = path.extname(filePath).toLowerCase();
    const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    
    if (!supportedFormats.includes(ext)) {
      console.log('Unsupported format:', ext);
      return next(); // Not an image format we can resize
    }
    
    // Get the width parameter
    const width = req.query.w ? parseInt(req.query.w) : null;
    const height = req.query.h ? parseInt(req.query.h) : null;
    
    // If neither width nor height are valid, skip resizing
    if ((width === null || isNaN(width)) && (height === null || isNaN(height))) {
      console.log('No valid dimensions provided');
      return next();
    }
    
    // Basic validation
    if ((width !== null && (isNaN(width) || width < 10 || width > 5000)) || 
        (height !== null && (isNaN(height) || height < 10 || height > 5000))) {
      return res.status(400).json({
        success: false, 
        message: 'Width and height parameters must be between 10 and 5000'
      });
    }
    
    // Get optional quality parameter
    const quality = req.query.q ? parseInt(req.query.q) : 80; // Default quality
    const validQuality = Math.min(100, Math.max(1, isNaN(quality) ? 80 : quality));
    
    console.log(`Resizing ${filePath} to width: ${width}, height: ${height}, quality: ${validQuality}`);
    
    // Create resizing options
    const resizeOptions = {};
    if (width) resizeOptions.width = width;
    if (height) resizeOptions.height = height;
    resizeOptions.withoutEnlargement = true; // Don't enlarge images
    
    // Process the image
    const imageBuffer = await sharp(filePath)
      .resize(resizeOptions)
      .toBuffer();
      
    // Set appropriate content type
    const outputFormat = ext.substring(1) === 'jpg' ? 'jpeg' : ext.substring(1).replace('.', '');
    res.setHeader('Content-Type', `image/${outputFormat}`);
    
    // Set cache headers (cache for 1 day)
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    console.log('Successfully resized image, sending response');
    
    // Send the resized image
    return res.send(imageBuffer);
  } catch (error) {
    console.error('Error resizing image:', error);
    return next(); // Continue to standard static file serving
  }
};
