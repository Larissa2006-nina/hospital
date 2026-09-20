const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-blood-bank-2026';

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function getAuthUserFromRequest(req) {
  try {
    let token = null;
    
    // Check Authorization header
    const authHeader = req.headers.get ? req.headers.get('authorization') : req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Check Cookies
    if (!token) {
      const cookieHeader = req.headers.get ? req.headers.get('cookie') : req.headers?.cookie;
      if (cookieHeader) {
        const parts = cookieHeader.split(';');
        for (const part of parts) {
          const [key, ...val] = part.trim().split('=');
          if (key === 'bloodlink_token' || key === 'token') {
            token = val.join('=');
            break;
          }
        }
      }
    }

    
    if (!token) return null;
    return verifyToken(token);
  } catch (err) {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  getAuthUserFromRequest,
};
