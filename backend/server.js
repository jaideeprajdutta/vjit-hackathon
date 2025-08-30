// server.js
import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// Import your route files
import createFeedbackRouter from './src/routes/feedback.js';
import healthRouter from './src/routes/health.js';

// Mock Supabase client for now
const mockSupabase = {
  from: (table) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: (data) => Promise.resolve({ data, error: null }),
    update: (data) => Promise.resolve({ data, error: null }),
    delete: () => Promise.resolve({ data: null, error: null })
  })
};

console.log('✅ Mock Supabase client initialized!');

const app = express();
const PORT = process.env.PORT || 5001; // Use port 5001 as default

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.resolve('uploads')));

// API Routes - Pass the mock Supabase client to your feedback router
app.use('/api/grievances', createFeedbackRouter(mockSupabase));
app.use('/api/health', healthRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});