import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Serverless-friendly configuration
  max: 1, // Maximum number of clients in the pool
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Wrapper function to handle database queries with retry logic
export async function queryWithRetry(text: string, params?: any[], retries = 3): Promise<any> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`Database query attempt ${i + 1} failed:`, error.message);
      
      // If it's a connection termination error, wait and retry
      if (error.code === 'XX000' || error.message.includes('db_termination')) {
        if (i < retries - 1) {
          console.log(`Retrying query in ${(i + 1) * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
          continue;
        }
      }
      
      // For other errors, don't retry
      throw error;
    }
  }
  
  throw lastError;
}

export default pool;
