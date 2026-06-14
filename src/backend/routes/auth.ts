import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'viewra-super-secret-key-change-me';

// Simple in-memory rate limiter for Auth endpoints
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function authRateLimiter(req: Request, res: Response, next: () => void) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const ipStr = Array.isArray(ip) ? ip[0] : ip;
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute window
  const maxRequests = 10; // Max 10 registration/login requests per minute

  const record = rateLimits.get(ipStr);
  if (!record || now > record.resetTime) {
    rateLimits.set(ipStr, { count: 1, resetTime: now + limitWindow });
    return next();
  }

  if (record.count >= maxRequests) {
    res.status(429).json({
      error: 'Too many authentication attempts. Please try again after 1 minute.'
    });
    return;
  }

  record.count++;
  rateLimits.set(ipStr, record);
  next();
}

// Zod validation schemas
const registerSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .max(20, { message: 'Username cannot exceed 20 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain alphanumeric characters and underscores' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' })
});

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, { message: 'Username or email is required' }),
  password: z.string().min(1, { message: 'Password is required' })
});

// Register Endpoint
router.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { username, email, password } = parseResult.data;

    // Check if user already exists (by username or email)
    const existingUserByUsername = await db.findUserByUsername(username);
    if (existingUserByUsername) {
      res.status(400).json({ error: 'Username is already taken' });
      return;
    }

    const existingUserByEmail = await db.findUserByEmail(email);
    if (existingUserByEmail) {
      res.status(400).json({ error: 'Email is already registered' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await db.createUser({
      username,
      email,
      passwordHash
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login Endpoint
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { usernameOrEmail, password } = parseResult.data;

    // Retrieve user by username or email
    let user = await db.findUserByUsername(usernameOrEmail);
    if (!user) {
      user = await db.findUserByEmail(usernameOrEmail);
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid username/email or password' });
      return;
    }

    // Verify Password
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      res.status(401).json({ error: 'Invalid username/email or password' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

export default router;
