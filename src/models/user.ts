import pool from '../config/database';
import { User, CreateUserDTO, UserProfile } from '../types/user';
import bcrypt from 'bcryptjs';

export class UserModel {
  static async create(userData: CreateUserDTO): Promise<UserProfile> {
    const { username, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use Supabase's built-in users table structure
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, raw_user_meta_data)
       VALUES ($1, $2, $3)
       RETURNING id, email, created_at`,
      [email, hashedPassword, JSON.stringify({ username })]
    );

    return {
      id: result.rows[0].id,
      username: username,
      email: result.rows[0].email,
      created_at: result.rows[0].created_at
    };
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, email, password_hash, raw_user_meta_data, created_at FROM users WHERE email = $1',
      [email]
    );

    if (!result.rows[0]) return null;

    const user = result.rows[0];
    const metaData = user.raw_user_meta_data || {};
    
    return {
      id: user.id,
      username: metaData.username || '',
      email: user.email,
      password: user.password_hash,
      created_at: user.created_at,
      updated_at: user.created_at
    };
  }

  static async findById(id: string): Promise<UserProfile | null> {
    const result = await pool.query(
      'SELECT id, email, raw_user_meta_data, created_at FROM users WHERE id = $1',
      [id]
    );

    if (!result.rows[0]) return null;

    const user = result.rows[0];
    const metaData = user.raw_user_meta_data || {};

    return {
      id: user.id,
      username: metaData.username || '',
      email: user.email,
      created_at: user.created_at
    };
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}
