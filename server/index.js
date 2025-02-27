import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import assetRoutes from './routes/assetRoutes.js';
import { imageResizeMiddleware } from './middleware/imageResize.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration for more permissive development settings
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:8080', 'http://127.0.0.1:5500'];

// More permissive CORS for development
if (process.env.NODE_ENV === 'development') {
  // Simple CORS setup for development - allows all origins
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  
  console.log('Running with development CORS (all origins allowed)');
} else {
  // Production CORS with specific allowed origins
  app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Content-Disposition'] // For file download headers
  }));
  
  console.log(`Running with production CORS (allowed origins: ${allowedOrigins.join(', ')})`);
}

// Explicitly handle OPTIONS requests for preflight
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse query parameters for all routes (needed for the resize middleware)
app.use((req, res, next) => {
  // Parse query string if not already parsed
  if (!req.query) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    req.query = Object.fromEntries(url.searchParams);
  }
  next();
});

// Routes
app.use('/api', assetRoutes);

// Apply image resize middleware before static files
console.log('Setting up image resize middleware for /assets path');
app.use('/assets', imageResizeMiddleware);

// Static file serving - adjust the path as needed
app.use('/assets', express.static('assets'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An error occurred on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Direct image resizing via URL available (example: /assets/path/to/image.jpg?w=200)`);
});
