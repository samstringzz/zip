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
      dbInfo: '/db-info',
      setupDb: '/setup-db (POST)'
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
      errorCode: (error as any)?.code || 'UNKNOWN',
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

// Database setup endpoint (for initial setup - remove in production)
app.post('/setup-db', async (_req: Request, res: Response) => {
  try {
    const pool = require('./config/database').default;
    
    // Create UUID extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create relationships table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS relationships (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `);
    
    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_relationships_follower ON relationships(follower_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_relationships_following ON relationships(following_id)');
    
    res.status(200).json({ 
      status: 'Database setup completed successfully',
      tables: ['users', 'relationships']
    });
  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({ 
      status: 'Database setup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});