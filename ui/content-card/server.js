import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Configure Brotli compression with explicit settings
app.use(compression({
  // Prefer Brotli over gzip
  brotli: {
    enabled: true,
    zlib: {},
  },
  level: 6,
  threshold: 0, // Compress everything, no matter how small
  filter: (req, res) => {
    // Skip if explicitly disabled
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Always compress text-based content
    const contentType = res.getHeader('content-type') || '';
    const url = req.url || '';
    
    // Compress by content type or file extension
    return /text\/|application\/.*script|application\/json|application\/xml|\+json|\+xml/.test(contentType) ||
           /\.(html|css|js|json|xml|svg|txt|md)$/.test(url);
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
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
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