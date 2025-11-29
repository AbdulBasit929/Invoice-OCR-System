// src/server.js - Main Server File

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const queueService = require('./services/queue.service');


const connectDB = require('./config/database');
const config = require('./config/env');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { cleanupOldFiles } = require('./utils/helpers');

// Import routes
const authRoutes = require('./routes/auth.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analytics.routes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// CORS configuration
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Rate limiting
// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.NODE_ENV === 'development' ? 500 : config.RATE_LIMIT_MAX_REQUESTS, // More requests in dev
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.NODE_ENV === 'development', // Skip rate limiting in development
});

app.use('/api/', limiter);
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Invoice OCR Backend API',
    version: config.API_VERSION,
    documentation: `/api/${config.API_VERSION}/docs`,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Scheduled tasks
if (config.NODE_ENV === 'production') {
  // Clean up old uploaded files daily at 2 AM
  cron.schedule('0 2 * * *', () => {
    logger.info('Running cleanup task for old files');
    cleanupOldFiles(config.UPLOAD_DIR, 24);
    cleanupOldFiles(path.join(__dirname, '../exports'), 1);
  });

  // Clean up old logs weekly
  cron.schedule('0 3 * * 0', () => {
    logger.info('Running cleanup task for old logs');
    const logsDir = path.dirname(config.LOG_FILE);
    cleanupOldFiles(logsDir, 168); // 7 days
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Start server
const PORT = config.PORT || 4000;
const server = app.listen(PORT, () => {
  logger.info(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 Invoice OCR Backend API Server                      ║
  ║                                                           ║
  ║   Environment: ${config.NODE_ENV.padEnd(43)}║
  ║   Port: ${PORT.toString().padEnd(50)}║
  ║   API Version: ${config.API_VERSION.padEnd(43)}║
  ║                                                           ║
  ║   📝 Endpoints:                                           ║
  ║   - Health: http://localhost:${PORT}/health${' '.repeat(20)}║
  ║   - API: http://localhost:${PORT}/api/${config.API_VERSION}${' '.repeat(18)}║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});
// Add graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing queue service...');
  await queueService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing queue service...');
  await queueService.close();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;