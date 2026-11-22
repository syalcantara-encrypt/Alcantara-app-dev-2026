const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../../db");

const ROLES = ["reader", "author", "admin"];

// ---------- helpers ----------

// Hash a password with Node crypto (random salt + scrypt). Saved as "salt:hash"
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const attempt = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), attempt);
}

// The database stores only a SHA-256 hash (64 characters) of the refresh token
function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// Access token: { id, username, role }, 15 minutes
function signAccess(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

// Refresh token: type "refresh", 7 days. jwtid makes every token unique.
function signRefresh(user) {
  return jwt.sign(
    { id: user.id, type: "refresh" },
    process.env.JWT_SECRET,
    { expiresIn: "7d", jwtid: crypto.randomUUID() }
  );
}

// ---------- POST /register ----------
exports.register = async (req, res) => {
  const { username, password, role } = req.body || {};
  let { email } = req.body || {};

  if (!username || !password || !role) {
    return res.status(400).json({ error: "username, password and role are required" });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: "role must be reader, author or admin" });
  }
  // The users table requires an email. If none is sent, build one from the username.
  if (!email) email = `${username}@blog.local`;

  const [byName] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
  if (byName.length) return res.status(409).json({ error: "Username already taken" });

  const [byEmail] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
  if (byEmail.length) return res.status(409).json({ error: "Email already taken" });

  const [roleRows] = await db.query("SELECT id FROM roles r WHERE r.role = ?", [role]);
  if (!roleRows.length) return res.status(400).json({ error: "role must be reader, author or admin" });

  const [result] = await db.query(
    "INSERT INTO users (email, username, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, 1)",
    [email, username, hashPassword(password), roleRows[0].id]
  );

  res.status(201).json({ id: result.insertId, username, email, role });
};

// ---------- POST /login ----------
exports.login = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const [rows] = await db.query(
    "SELECT u.id, u.username, u.password_hash, u.is_active, r.role AS role " +
      "FROM users u JOIN roles r ON r.id = u.role_id WHERE u.username = ?",
    [username]
  );
  const user = rows[0];

  if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Wrong credentials" });
  }

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [user.id, sha256(refreshToken), expiresAt]
  );

  res.status(200).json({ accessToken, refreshToken });
};

// ---------- POST /refresh ----------
exports.refresh = async (req, res) => {
  const refreshToken = (req.body || {}).refreshToken || (req.cookies || {}).refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ error: "refreshToken is required" });
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  if (payload.type !== "refresh") {
    return res.status(401).json({ error: "Not a refresh token" });
  }

  const [rows] = await db.query(
    "SELECT rt.revoked_at, rt.expires_at, u.id AS user_id, u.username, u.is_active, r.role AS role " +
      "FROM refresh_tokens rt " +
      "JOIN users u ON u.id = rt.user_id " +
      "JOIN roles r ON r.id = u.role_id " +
      "WHERE rt.token_hash = ?",
    [sha256(refreshToken)]
  );
  const row = rows[0];

  if (!row || row.revoked_at || !row.is_active || new Date(row.expires_at) < new Date()) {
    return res.status(401).json({ error: "Token revoked or expired" });
  }

  const accessToken = signAccess({ id: row.user_id, username: row.username, role: row.role });
  res.status(200).json({ accessToken });
};

// ---------- POST /logout ----------
exports.logout = async (req, res) => {
  const refreshToken = (req.body || {}).refreshToken || (req.cookies || {}).refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ error: "refreshToken is required" });
  }

  await db.query(
    "UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL",
    [new Date(), sha256(refreshToken)]
  );

  res.status(200).json({ message: "Logged out" });
};