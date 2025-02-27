import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Helper function to generate consistent directory path from SKU
function getAssetDirectoryPath(sku) {
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
  return path.join('assets', ...dirPath);
}

// Get asset by ID with optional dimensions and DPI
export const getAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { width, height, dpi } = req.query;
    
    // Use the helper function to get the directory path
    const dir = getAssetDirectoryPath(id);
    
    // Check if directory exists
    if (!fs.existsSync(dir)) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }
    
    // Read directory to find files
    const files = fs.readdirSync(dir);
    
    // Look for default file first, then take the first one
    let assetFile = files.find(file => file.includes('default')) || files[0];
    
    if (!assetFile) {
      return res.status(404).json({
        success: false,
        message: 'No assets found for this ID'
      });
    }
    
    const filePath = path.join(dir, assetFile);
    const fileExt = path.extname(filePath).toLowerCase();
    
    // For image files, apply resizing if requested
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fileExt) && (width || height || dpi)) {
      const resizeOptions = {};
      
      if (width) resizeOptions.width = parseInt(width);
      if (height) resizeOptions.height = parseInt(height);
      
      // Set DPI metadata if specified
      const metadata = dpi ? { density: parseInt(dpi) } : {};
      
      // Process the image
      const imageBuffer = await sharp(filePath)
        .resize(resizeOptions)
        .withMetadata(metadata)
        .toBuffer();
      
      // Set appropriate content type
      res.set('Content-Type', `image/${fileExt.substring(1)}`);
      return res.send(imageBuffer);
    }
    
    // For non-image files or no resize requested, send the file directly
    res.sendFile(path.resolve(filePath));
    
  } catch (error) {
    console.error('Error getting asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve asset',
      error: error.message
    });
  }
};

// Upload a new asset
export const uploadAsset = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded'
      });
    }
    
    const { id } = req.params;
    const { default: isDefault } = req.query;
    const filePath = req.file.path;
    
    // If marked as default, we might need to rename or tag the file
    if (isDefault === 'true') {
      const dir = path.dirname(filePath);
      const ext = path.extname(filePath);
      const filename = path.basename(filePath, ext);
      
      // Rename the file to include "default" in the name
      const newPath = path.join(dir, `${filename}-default${ext}`);
      fs.renameSync(filePath, newPath);
      
      return res.status(201).json({
        success: true,
        message: 'Asset uploaded successfully and set as default',
        asset: {
          id,
          path: newPath.replace(/\\/g, '/'),
          default: true
        }
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully',
      asset: {
        id,
        path: filePath.replace(/\\/g, '/'),
        default: false
      }
    });
    
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload asset',
      error: error.message
    });
  }
};

// Get list of assets in a specific folder
export const getAssetList = (req, res) => {
  try {
    const { id } = req.params;
    
    // Use the helper function to get the directory path
    const dir = getAssetDirectoryPath(id);
    
    // Check if directory exists
    if (!fs.existsSync(dir)) {
      return res.status(404).json({
        success: false,
        message: 'Asset folder not found'
      });
    }
    
    // Read directory to find files
    const files = fs.readdirSync(dir);
    
    // Get details for each file
    const assets = files.map(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      return {
        name: file,
        path: filePath.replace(/\\/g, '/'),
        size: stats.size,
        isDefault: file.includes('default'),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    });
    
    res.json({
      success: true,
      count: assets.length,
      assets
    });
    
  } catch (error) {
    console.error('Error listing assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve asset list',
      error: error.message
    });
  }
};

// Set an asset as default
export const setDefaultAsset = async (req, res) => {
  try {
    const { id, filename } = req.params;
    
    // Use the helper function to get the directory path
    const dir = getAssetDirectoryPath(id);
    
    // Check if directory exists
    if (!fs.existsSync(dir)) {
      return res.status(404).json({
        success: false,
        message: 'Asset folder not found'
      });
    }
    
    // Read directory to find files
    const files = fs.readdirSync(dir);
    
    // Check if the requested file exists
    if (!files.includes(filename)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // First, remove default flag from any existing default files
    for (const file of files) {
      if (file.includes('-default')) {
        // Get the name without default flag
        const baseName = file.replace('-default', '');
        const ext = path.extname(baseName);
        const nameWithoutExt = baseName.substring(0, baseName.length - ext.length);
        
        // Rename to remove default flag
        const oldPath = path.join(dir, file);
        const newPath = path.join(dir, `${nameWithoutExt}${ext}`);
        fs.renameSync(oldPath, newPath);
      }
    }
    
    // Now set the new file as default
    const ext = path.extname(filename);
    const nameWithoutExt = filename.substring(0, filename.length - ext.length);
    
    // Check if the file already has a default flag
    if (!nameWithoutExt.includes('-default')) {
      const oldPath = path.join(dir, filename);
      const newPath = path.join(dir, `${nameWithoutExt}-default${ext}`);
      fs.renameSync(oldPath, newPath);
      
      return res.json({
        success: true,
        message: 'Asset set as default',
        asset: {
          id,
          name: `${nameWithoutExt}-default${ext}`,
          path: newPath.replace(/\\/g, '/'),
          default: true
        }
      });
    } else {
      // File is already default
      return res.json({
        success: true,
        message: 'Asset is already set as default',
        asset: {
          id,
          name: filename,
          path: path.join(dir, filename).replace(/\\/g, '/'),
          default: true
        }
      });
    }
  } catch (error) {
    console.error('Error setting default asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default asset',
      error: error.message
    });
  }
};
