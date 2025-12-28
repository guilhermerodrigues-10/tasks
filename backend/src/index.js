const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// JWT secret (should be in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', message: 'FlowState Backend is running', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: err.message });
  }
});

// Helper: Generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper: Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// ==================== AUTH ENDPOINTS ====================

// Sign Up
app.post('/auth/signup', async (req, res) => {
  try {
    console.log('Signup request:', req.body);
    let { email, password } = req.body;

    // Trim email and password to avoid whitespace issues
    email = email?.trim();
    password = password?.trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM auth.users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into auth.users
    const result = await pool.query(
      `INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        raw_app_meta_data,
        raw_user_meta_data
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        $1,
        $2,
        NOW(),
        NOW(),
        NOW(),
        '',
        '{"provider":"email","providers":["email"]}',
        '{}'
      ) RETURNING id, email, created_at`,
      [email, hashedPassword]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email);

    console.log('Signup success:', user);

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {},
          aud: 'authenticated',
          role: 'authenticated'
        },
        session: {
          access_token: token,
          token_type: 'bearer',
          expires_in: 604800, // 7 days in seconds
          expires_at: Math.floor(Date.now() / 1000) + 604800,
          refresh_token: token,
          user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          }
        }
      }
    });
  } catch (err) {
    console.error('Signup exception:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sign In
app.post('/auth/signin', async (req, res) => {
  try {
    console.log('Signin request:', req.body);
    let { email, password } = req.body;

    // Trim email and password to avoid whitespace issues
    email = email?.trim();
    password = password?.trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database
    const result = await pool.query(
      'SELECT id, email, encrypted_password, created_at FROM auth.users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.encrypted_password);

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email);

    console.log('Signin success:', { id: user.id, email: user.email });

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {},
          aud: 'authenticated',
          role: 'authenticated'
        },
        session: {
          access_token: token,
          token_type: 'bearer',
          expires_in: 604800,
          expires_at: Math.floor(Date.now() / 1000) + 604800,
          refresh_token: token,
          user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          }
        }
      }
    });
  } catch (err) {
    console.error('Signin exception:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sign Out
app.post('/auth/signout', async (req, res) => {
  try {
    // With JWT, sign out is handled client-side by removing the token
    res.json({ message: 'Signed out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User
app.get('/auth/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const result = await pool.query(
      'SELECT id, email, created_at FROM auth.users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DATA ENDPOINTS ====================

// Generic GET endpoint
app.get('/data/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const result = await pool.query(
      `SELECT * FROM public."${table}" WHERE user_id = $1`,
      [decoded.userId]
    );

    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic POST endpoint
app.post('/data/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const payload = { ...req.body, user_id: decoded.userId };
    const columns = Object.keys(payload);
    const values = Object.values(payload);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
      `INSERT INTO public."${table}" (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic PUT endpoint
app.put('/data/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const updates = Object.keys(req.body)
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(', ');
    const values = [...Object.values(req.body), id, decoded.userId];

    const result = await pool.query(
      `UPDATE public."${table}" SET ${updates} WHERE id = $${values.length - 1} AND user_id = $${values.length} RETURNING *`,
      values
    );

    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic DELETE endpoint
app.delete('/data/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await pool.query(
      `DELETE FROM public."${table}" WHERE id = $1 AND user_id = $2`,
      [id, decoded.userId]
    );

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FlowState Backend running on port ${PORT}`);
  console.log(`📡 Database: ${process.env.DATABASE_URL ? 'Connected' : 'No connection string'}`);
});
