"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = require("../models/user");
class AuthController {
    static register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = req.body;
                // Check if user already exists
                const existingUser = yield user_1.UserModel.findByEmail(userData.email);
                if (existingUser) {
                    return res.status(400).json({ error: 'Email already registered' });
                }
                // Create new user
                const newUser = yield user_1.UserModel.create(userData);
                // Generate JWT token
                const token = jsonwebtoken_1.default.sign({ userId: newUser.id }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
                res.status(201).json({
                    user: newUser,
                    token
                });
            }
            catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const loginData = req.body;
                // Find user by email
                const user = yield user_1.UserModel.findByEmail(loginData.email);
                if (!user) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
                // Validate password
                const isValidPassword = yield user_1.UserModel.validatePassword(user, loginData.password);
                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
                // Generate JWT token
                const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
                res.json({
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        created_at: user.created_at
                    },
                    token
                });
            }
            catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
}
exports.AuthController = AuthController;
