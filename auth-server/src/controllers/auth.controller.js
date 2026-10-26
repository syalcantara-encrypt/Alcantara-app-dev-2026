const crypto = require('crypto');   // Node's built-in tool (exam requires it for hashing)
const path = require('path');
const jwt = require('jsonwebtoken');
const { load, save } = require('../utils/storage');

// Where users are saved on disk
const FILE = path.join(__dirname, '..', '..', 'data', 'users.json');

// In-memory array, filled from the file when the server starts
const users = load(FILE);

const ROLES = ['reader', 'author', 'admin'];

// ------------------------------------------------------------
// HELPER 1: hash a password (never store the real password!)
// ------------------------------------------------------------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');           // random extra text
  const hash = crypto.scryptSync(password, salt, 64).toString('hex'); // scramble it
  return `${salt}:${hash}`;                                      // save both together
}

// ------------------------------------------------------------
// HELPER 2: check a typed password against the saved hash
// ------------------------------------------------------------
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const attempt = crypto.scryptSync(password, salt, 64);         // scramble the typed one the same way
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), attempt); // compare
}

// ------------------------------------------------------------
// HELPER 3 & 4: make the two kinds of tokens
// ------------------------------------------------------------
// Access token: contains id, username, role. Lasts 15 minutes.
function signAccess(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// Refresh token: has type "refresh". Lasts 7 days. Same secret.
function signRefresh(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ============================================================
// POST /register
// ============================================================
exports.register = (req, res) => {
  const { username, password, role } = req.body;

  // 400: something missing
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'username, password and role are required' });
  }
  // 400: role is not one of the 3
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'role must be reader, author or admin' });
  }
  // 409: someone already has this username
  if (users.some((u) => u.username === username)) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  // Build the user object exactly as the exam schema says
  const user = {
    id: users.reduce((max, u) => Math.max(max, u.id), 0) + 1, // next number: 1, 2, 3...
    username,
    hashed_password: hashPassword(password),
    role,
    refresh_token: null,
    created_at: new Date().toISOString(),
    revoked_at: null,
  };

  users.push(user);      // add to the array
  save(FILE, users);     // save to the file

  // 201 Created. We do NOT send back the password hash.
  res.status(201).json({ id: user.id, username: user.username, role: user.role });
};

// ============================================================
// POST /login
// ============================================================
exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = users.find((u) => u.username === username);

  // 401 if user doesn't exist OR password is wrong (same message on purpose)
  if (!user || !verifyPassword(password, user.hashed_password)) {
    return res.status(401).json({ error: 'Wrong credentials' });
  }

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);

  user.refresh_token = refreshToken; // store the refresh token (exam requirement)
  user.revoked_at = null;            // wipe revoked_at (exam requirement)
  save(FILE, users);

  res.status(200).json({ accessToken, refreshToken });
};

// ============================================================
// POST /refresh
// ============================================================
exports.refresh = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  // Step 1: is the token real and not expired?
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Step 2: is it a refresh token (not an access token)?
  if (payload.type !== 'refresh') {
    return res.status(401).json({ error: 'Not a refresh token' });
  }

  // Step 3: does it match the one we saved for this user?
  const user = users.find((u) => u.id === payload.id);
  if (!user || user.refresh_token !== refreshToken) {
    return res.status(401).json({ error: 'Token revoked' });
  }

  // All good: give a new access token
  res.status(200).json({ accessToken: signAccess(user) });
};

// ============================================================
// POST /logout
// ============================================================
exports.logout = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  const user = users.find((u) => u.refresh_token === refreshToken);
  if (user) {
    user.refresh_token = null;                  // remove the token
    user.revoked_at = new Date().toISOString(); // note when
    save(FILE, users);
  }

  res.status(200).json({ message: 'Logged out' });
};