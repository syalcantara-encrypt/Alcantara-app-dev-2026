const db = require("../../db");

// Every query returns the post together with its author name
const SELECT_POSTS =
  "SELECT p.id, p.author_id, u.username AS author_username, p.title, p.content, " +
  "p.created_at, p.updated_at FROM posts p JOIN users u ON u.id = p.author_id";

// GET /api/posts (public)
exports.getAllPosts = async (req, res) => {
  const [rows] = await db.query(SELECT_POSTS + " ORDER BY p.created_at DESC, p.id DESC");
  res.status(200).json(rows);
};

// GET /api/posts/:id (public)
exports.getPostById = async (req, res) => {
  const [rows] = await db.query(SELECT_POSTS + " WHERE p.id = ?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: "Post not found" });
  res.status(200).json(rows[0]);
};

// GET /api/me/posts (any logged-in user)
exports.getMyPosts = async (req, res) => {
  const [rows] = await db.query(
    SELECT_POSTS + " WHERE p.author_id = ? ORDER BY p.created_at DESC, p.id DESC",
    [req.user.id]
  );
  res.status(200).json(rows);
};

// POST /api/posts (author, admin) - author_id comes from the token
exports.createPost = async (req, res) => {
  const { title, content } = req.body || {};
  if (typeof title !== "string" || typeof content !== "string" || !title.trim() || !content.trim()) {
    return res.status(400).json({ error: "title and content are required" });
  }
  if (title.length > 255) {
    return res.status(400).json({ error: "title must be 255 characters or less" });
  }

  const [result] = await db.query(
    "INSERT INTO posts (author_id, title, content) VALUES (?, ?, ?)",
    [req.user.id, title.trim(), content.trim()]
  );
  const [rows] = await db.query(SELECT_POSTS + " WHERE p.id = ?", [result.insertId]);
  res.status(201).json(rows[0]);
};

// PUT /api/posts/:id (owner or admin)
exports.updatePost = async (req, res) => {
  const [found] = await db.query("SELECT id, author_id FROM posts WHERE id = ?", [req.params.id]);
  if (!found.length) return res.status(404).json({ error: "Post not found" });

  const post = found[0];
  if (post.author_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "You can only edit your own posts" });
  }

  const { title, content } = req.body || {};
  if (!title && !content) {
    return res.status(400).json({ error: "Provide a title or content to update" });
  }
  if (title && (typeof title !== "string" || title.length > 255)) {
    return res.status(400).json({ error: "title must be text of 255 characters or less" });
  }
  if (content && typeof content !== "string") {
    return res.status(400).json({ error: "content must be text" });
  }

  // COALESCE keeps the old value when a field was not sent
  await db.query(
    "UPDATE posts SET title = COALESCE(?, title), content = COALESCE(?, content) WHERE id = ?",
    [title || null, content || null, post.id]
  );
  const [rows] = await db.query(SELECT_POSTS + " WHERE p.id = ?", [post.id]);
  res.status(200).json(rows[0]);
};

// DELETE /api/posts/:id (admin only - enforced in the route)
exports.deletePost = async (req, res) => {
  const [result] = await db.query("DELETE FROM posts WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: "Post not found" });
  res.status(200).json({ message: "Post deleted" });
};