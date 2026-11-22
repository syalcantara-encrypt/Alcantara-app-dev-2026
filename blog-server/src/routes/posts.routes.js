const express = require('express');
const router = express.Router();
const postsController = require('../controllers/posts.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Public
router.get('/posts', postsController.getAllPosts);
router.get('/posts/:id', postsController.getPostById);

// Protected
router.get('/me/posts', authenticate, postsController.getMyPosts);
router.post('/posts', authenticate, authorize('author', 'admin'), postsController.createPost);
router.put('/posts/:id', authenticate, postsController.updatePost);
router.delete('/posts/:id', authenticate, authorize('admin'), postsController.deletePost);

module.exports = router;