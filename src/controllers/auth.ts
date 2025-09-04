import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user';
import { CreateUserDTO, LoginDTO } from '../types/user';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const userData: CreateUserDTO = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create new user
      const newUser = await UserModel.create(userData);

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        user: newUser,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const loginData: LoginDTO = req.body;

      // Find user by email
      const user = await UserModel.findByEmail(loginData.email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Validate password
      const isValidPassword = await UserModel.validatePassword(user, loginData.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '24h' }
      );

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
