import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import zohoRoutes from './routes/zohoRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const app = express();

// Trust reverse proxy headers for accurate client IP identification in audit logs
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false // Allows frontend API communication in development
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: true, // Allow frontend dev origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Custom Employee Portal Backend'
  });
});

// Primary API Routes
app.use('/api/auth', authRoutes);
app.use('/api/zoho', zohoRoutes);
app.use('/api/admin', adminRoutes);

// Fallback handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
