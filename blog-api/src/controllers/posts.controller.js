const path = require('path');
const { load, save } = require('../utils/storage');

const FILE = path.join(__dirname, '..', '..', 'data', 'posts.json');
const posts = load(FILE);

// GET /api/posts (public)
exports.getAllPosts = (req, res) => {
  res.status(200).json(posts);
};

// GET /api/posts/:id (public)
exports.getPostById = (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.status(200).json(post);
};

// GET /api/me/posts (any logged-in user)
exports.getMyPosts = (req, res) => {
  res.status(200).json(posts.filter((p) => p.user_id === req.user.id));
};

// POST /api/posts (author, admin)
exports.createPost = (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  const post = {
    id: posts.reduce((max, p) => Math.max(max, p.id), 0) + 1,
    user_id: req.user.id,
    title,
    content,
    created_at: new Date().toISOString(),
  };

  posts.push(post);
  save(FILE, posts);
  res.status(201).json(post);
};

// PUT /api/posts/:id (owner or admin)
exports.updatePost = (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const isOwner = post.user_id === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'You can only edit your own posts' });
  }

  const { title, content } = req.body;
  if (!title && !content) {
    return res.status(400).json({ error: 'Provide a title or content to update' });
  }

  if (title) post.title = title;
  if (content) post.content = content;
  post.updated_at = new Date().toISOString();

  save(FILE, posts);
  res.status(200).json(post);
};

// DELETE /api/posts/:id (admin only)
exports.deletePost = (req, res) => {
  const index = posts.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  posts.splice(index, 1);
  save(FILE, posts);
  res.status(200).json({ message: 'Post deleted' });
};