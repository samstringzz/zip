import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import connectionRoutes from './routes/connections';

dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Abbey Social Platform Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      connections: '/api/connections',
      health: '/health',
      testDb: '/test-db',
      dbInfo: '/db-info'
    }
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Database connection test endpoint
app.get('/test-db', async (_req: Request, res: Response) => {
  try {
    const pool = require('./config/database').default;
    const result = await pool.query('SELECT NOW() as current_time');
    res.status(200).json({ 
      status: 'Database connected successfully',
      currentTime: result.rows[0].current_time,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      status: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      errorCode: error instanceof Error ? error.code : 'UNKNOWN',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    });
  }
});

// Database URL info endpoint (for debugging - remove in production)
app.get('/db-info', (_req: Request, res: Response) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.status(400).json({ error: 'DATABASE_URL not set' });
  }
  
  // Parse the URL to show parts (without password)
  try {
    const url = new URL(dbUrl);
    res.json({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      database: url.pathname.slice(1),
      username: url.username,
      hasPassword: !!url.password,
      fullUrl: dbUrl.replace(/:[^:@]+@/, ':***@') // Hide password
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Invalid DATABASE_URL format',
      url: dbUrl.replace(/:[^:@]+@/, ':***@')
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});