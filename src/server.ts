import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { connectDB } from './config/database';

// Import routes
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import leaveRoutes from './routes/leave';
import attendanceRoutes from './routes/attendance';
import payrollRoutes from './routes/payroll';
import recruitmentRoutes from './routes/recruitment';
import performanceRoutes from './routes/performance';
import documentRoutes from './routes/documents';
import reportRoutes from './routes/reports';

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HRM System API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  // For SPA, catch-all route to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// 404 handler (only in development, since production catches all above)
if (process.env.NODE_ENV !== 'production') {
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.originalUrl} not found`
    });
  });
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
