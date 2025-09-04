import pool, { queryWithRetry } from '../config/database';
import { User, CreateUserDTO, UserProfile } from '../types/user';
import bcrypt from 'bcryptjs';

export class UserModel {
  // Ensure the custom_users table exists
  private static async ensureTableExists() {
    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS custom_users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  static async create(userData: CreateUserDTO): Promise<UserProfile> {
    const { username, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure table exists before creating user
    await this.ensureTableExists();

    // Insert into our custom users table
    const result = await queryWithRetry(
      `INSERT INTO custom_users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, hashedPassword]
    );

    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    // Ensure table exists before querying
    await this.ensureTableExists();
    
    const result = await queryWithRetry(
      'SELECT id, username, email, password, created_at FROM custom_users WHERE email = $1',
      [email]
    );

    if (!result.rows[0]) return null;

    const user = result.rows[0];
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      created_at: user.created_at,
      updated_at: user.created_at
    };
  }

  static async findById(id: string): Promise<UserProfile | null> {
    // Ensure table exists before querying
    await this.ensureTableExists();
    
    const result = await queryWithRetry(
      'SELECT id, username, email, created_at FROM custom_users WHERE id = $1',
      [id]
    );

    if (!result.rows[0]) return null;

    const user = result.rows[0];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at
    };
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}
