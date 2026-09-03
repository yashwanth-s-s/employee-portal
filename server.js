import app from './src/app.js';
import { config } from './src/config/index.js';
import prisma from './src/database/prisma.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Employee Portal Backend Server Running on Port ${PORT}`);
  console.log(`🌐 Base API URL: http://localhost:${PORT}/api`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔒 Security: Helmet, CORS, JWT & Strict RBAC Active`);
  console.log('====================================================');
});

// Graceful process shutdown
async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('Prisma disconnected. Server terminated.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
