import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Configure Brotli compression
app.use(compression({
  // Enable Brotli compression
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    // Compress all text-based content
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    const contentType = res.getHeader('content-type');
    if (contentType) {
      // Compress HTML, CSS, JavaScript, JSON
      return /text|javascript|json|css|html/.test(contentType);
    }
    
    return compression.filter(req, res);
  }
}));

// Set proper cache headers for static assets
app.use('/static', (req, res, next) => {
  // Cache static assets for 1 year
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  // Set proper MIME types
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.avif')) {
      res.setHeader('Content-Type', 'image/avif');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Handle SPA routing - serve index.html for any route that doesn't match a file
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.includes('.')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    next();
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🗜️  Brotli compression enabled for text content`);
});