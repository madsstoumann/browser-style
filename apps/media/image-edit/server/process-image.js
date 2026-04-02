const sharp = require('sharp');
const fetch = require('node-fetch');

/**
 * Process an image using Sharp based on transformation parameters
 */
async function processImage(req, res) {
  try {
    const { src, transforms } = req.query;
    
    // Fetch the source image (assuming it's a URL)
    const imageResponse = await fetch(src);
    const imageBuffer = await imageResponse.buffer();
    
    // Start with Sharp instance
    let image = sharp(imageBuffer);
    
    // Apply each transformation
    for (const transform of JSON.parse(transforms)) {
      const { method, params } = transform;
      
      // Apply the method if it exists on Sharp
      if (typeof image[method] === 'function') {
        image = image[method](...params);
      }
    }
    
    // Output the processed image
    const processedBuffer = await image.toBuffer();
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg'); // Adjust based on output format
    res.send(processedBuffer);
    
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).send('Error processing image');
  }
}

module.exports = processImage;
