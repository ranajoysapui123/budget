
// Fixed Backend Auth Routes (auth.ts)
import { Router, Response, Request, NextFunction } from 'express';
import express from 'express'; // Add this import
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { DatabaseService } from '../db/index';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

// Database service instance
let dbService: DatabaseService;

export const initializeAuth = (databaseService: DatabaseService): void => {
  dbService = databaseService;
};

// Change this line - use express.Router instead of Router
const router: express.Router = Router();

// Session management with better typing
interface SessionData {
  userId: string;
  pinVerified: boolean;
  lastActivity: Date;
  expiresAt: Date;
}

const sessions = new Map<string, SessionData>();

// Clean expired sessions - improved with better error handling
const cleanupInterval = setInterval(() => {
  try {
    const now = new Date();
    for (const [token, session] of sessions.entries()) {
      if (session.expiresAt < now) {
        sessions.delete(token);
      }
    }
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
}, 15 * 60 * 1000); // Clean every 15 minutes

// Graceful cleanup on process exit
process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
});

process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
});

// Fixed authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not configured');
    res.status(500).json({ message: 'Server configuration error' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(403).json({ message: 'Invalid or expired token' });
    return;
  }
};

// Fixed PIN verification middleware
const requirePinVerification = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  const session = sessions.get(token);
  if (!session || !session.pinVerified) {
    res.status(403).json({ message: 'PIN verification required' });
    return;
  }

  // Check if session has expired
  if (session.expiresAt < new Date()) {
    sessions.delete(token);
    res.status(403).json({ message: 'Session expired, please verify PIN again' });
    return;
  }

  // Update last activity
  session.lastActivity = new Date();
  next();
};

// Helper function to extract token
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers['authorization'];
  return authHeader && authHeader.split(' ')[1] || null;
};

// GET /me route - MUST come before other routes that might conflict
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user; // This contains { id, email } from JWT
    
    console.log('User from JWT:', user); // Debug log
    
    if (!user || !user.id || !user.email) {
      res.status(400).json({ message: 'Invalid token data' });
      return;
    }
    
    // Return user data from JWT token
    res.json({
      id: user.id,
      email: user.email
    });
  } catch (err) {
    console.error('Error in /me route:', err);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Fixed registration route in auth.ts
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    
    try {
      const { email, password } = req.body;
      
      // Check if database service is initialized
      if (!dbService) {
        console.error('Database service not initialized');
        res.status(500).json({ message: 'Database service unavailable' });
        return;
      }
      
      // Check if user already exists
      const existingUser = await dbService.getUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      // Create user
      const user = await dbService.createUser({ 
        email, 
        passwordHash,
        pinHash: null,
        pinAttempts: 0,
        pinLockedUntil: null
      });
      
      // Generate JWT token
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('JWT_SECRET not configured');
        res.status(500).json({ message: 'Server configuration error' });
        return;
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email },
        secret,
        { expiresIn: '24h' }
      );
      
      // FIXED: Return complete response with user data
      res.status(201).json({ 
        token,
        user: {
          id: user.id,
          email: user.email
        },
        pinRequired: false,
        pinVerified: true // New users don't need PIN verification initially
      });
      
    } catch (err) {
      console.error('Registration error:', err);
      // More detailed error logging
      if (err instanceof Error) {
        console.error('Error details:', err.message);
        console.error('Error stack:', err.stack);
      }
      res.status(500).json({ message: 'Error creating user' });
    }
  }
);
// Get session status - fixed error handling
router.get('/session-status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({ message: 'Token not found' });
      return;
    }
   // Get user from database to check PIN status
    const dbUser = await dbService.getUserByEmail(user.email);
    if (!dbUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const pinRequired = !!dbUser.pinHash;
    const session = sessions.get(token);
    
    // ✅ FIXED: For users without PIN, they should be considered "verified" 
    // so they can access the PIN setup page
    const pinVerified = pinRequired ? (session?.pinVerified || false) : true;

    res.json({
      user: { id: user.id, email: user.email },
      pinRequired,
      pinVerified,
      sessionExpiry: session?.expiresAt || null,
      needsPinSetup: !pinRequired // ✅ Add this flag for clarity
    });
  } catch (err) {
    console.error('Session status error:', err);
    res.status(500).json({ message: 'Error checking session status' });
  }
});

// Setup PIN (first time) - improved validation and error handling
router.post('/setup-pin',
  [body('pin').isLength({ min: 4, max: 6 }).isNumeric().withMessage('PIN must be 4-6 digits')],
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { pin } = req.body;
      const user = req.user!;
      const token = extractToken(req);

      if (!token) {
        res.status(401).json({ message: 'Token not found' });
        return;
      }

      // Check if PIN already exists
      const dbUser = await dbService.getUserByEmail(user.email);
      if (!dbUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (dbUser.pinHash) {
        res.status(400).json({ message: 'PIN already exists' });
        return;
      }

      const pinHash = await bcrypt.hash(pin, 12); // Increased salt rounds for better security
      await dbService.updateUserPin(user.id, pinHash);

      // Create or update session
      sessions.set(token, {
        userId: user.id,
        pinVerified: true,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
      });

      res.json({ message: 'PIN set up successfully' });
    } catch (err) {
      console.error('PIN setup error:', err);
      res.status(500).json({ message: 'Error setting up PIN' });
    }
  }
);

// Verify PIN - improved error handling and security
router.post('/verify-pin',
  [body('pin').isLength({ min: 4, max: 6 }).isNumeric().withMessage('PIN must be 4-6 digits')],
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { pin } = req.body;
      const user = req.user!;
      const token = extractToken(req);

      if (!token) {
        res.status(401).json({ message: 'Token not found' });
        return;
      }

      const dbUser = await dbService.getUserByEmail(user.email);
      if (!dbUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (!dbUser.pinHash) {
        res.status(400).json({ message: 'PIN not set up' });
        return;
      }

      // Check for lockout
      if (dbUser.pinLockedUntil && new Date(dbUser.pinLockedUntil) > new Date()) {
        const lockoutMinutes = Math.ceil((new Date(dbUser.pinLockedUntil).getTime() - Date.now()) / (1000 * 60));
        res.status(429).json({ 
          message: `PIN locked due to too many attempts. Try again in ${lockoutMinutes} minutes.` 
        });
        return;
      }

      const validPin = await bcrypt.compare(pin, dbUser.pinHash);
      if (!validPin) {
        // Increment failed attempts
        const attempts = (dbUser.pinAttempts || 0) + 1;
        const maxAttempts = 5;
        const lockUntil = attempts >= maxAttempts ? new Date(Date.now() + 15 * 60 * 1000) : undefined; // 15 min lockout
        
        await dbService.updatePinAttempts(user.id, attempts, lockUntil?.toISOString());
        
        const attemptsRemaining = maxAttempts - attempts;
        const message = attemptsRemaining > 0 
          ? `Invalid PIN. ${attemptsRemaining} attempts remaining.`
          : 'Invalid PIN. Account locked for 15 minutes.';
        
        res.status(401).json({ 
          message,
          attemptsRemaining: Math.max(0, attemptsRemaining)
        });
        return;
      }

      // Reset attempts on successful verification
      await dbService.updatePinAttempts(user.id, 0);

      // Update session
      sessions.set(token, {
        userId: user.id,
        pinVerified: true,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
      });

      res.json({ message: 'PIN verified successfully' });
    } catch (err) {
      console.error('PIN verification error:', err);
      res.status(500).json({ message: 'Error verifying PIN' });
    }
  }
);

// Change PIN - improved validation
router.post('/change-pin',
  [
    body('oldPin').isLength({ min: 4, max: 6 }).isNumeric().withMessage('Old PIN must be 4-6 digits'),
    body('newPin').isLength({ min: 4, max: 6 }).isNumeric().withMessage('New PIN must be 4-6 digits')
  ],
  authenticateToken,
  requirePinVerification,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { oldPin, newPin } = req.body;
      const user = req.user!;

      // Prevent using the same PIN
      if (oldPin === newPin) {
        res.status(400).json({ message: 'New PIN must be different from current PIN' });
        return;
      }

      const dbUser = await dbService.getUserByEmail(user.email);
      if (!dbUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (!dbUser.pinHash) {
        res.status(400).json({ message: 'PIN not set up' });
        return;
      }

      const validOldPin = await bcrypt.compare(oldPin, dbUser.pinHash);
      if (!validOldPin) {
        res.status(401).json({ message: 'Current PIN is incorrect' });
        return;
      }

      const newPinHash = await bcrypt.hash(newPin, 12);
      await dbService.updateUserPin(user.id, newPinHash);

      res.json({ message: 'PIN changed successfully' });
    } catch (err) {
      console.error('PIN change error:', err);
      res.status(500).json({ message: 'Error changing PIN' });
    }
  }
);

// Enhanced login with better session management
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 1 }).withMessage('Password is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { email, password } = req.body;
      const user = await dbService.getUserByEmail(email);

      if (!user) {
        res.status(401).json({ message: 'Authentication failed' });
        return;
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        res.status(401).json({ message: 'Authentication failed' });
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('JWT_SECRET not configured');
        res.status(500).json({ message: 'Server configuration error' });
        return;
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        secret,
        { expiresIn: '24h' }
      );

      // Create session but don't verify PIN yet
      sessions.set(token, {
        userId: user.id,
        pinVerified: false,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      // Check if PIN is required
      const pinRequired = !!user.pinHash;

      res.json({ 
        token,
        pinRequired,
        user: {
          id: user.id,
          email: user.email
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Error during authentication' });
    }
  }
);

// Logout endpoint to clean up sessions
router.post('/logout', authenticateToken, (req: Request, res: Response): void => {
  const token = extractToken(req);
  if (token) {
    sessions.delete(token);
  }
  res.json({ message: 'Logged out successfully' });
});

// Health check endpoint
router.get('/health', (req: Request, res: Response): void => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size
  });
});

export default router;