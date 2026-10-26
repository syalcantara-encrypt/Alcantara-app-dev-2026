require('dotenv').config({ path: '../.env' });
const express = require('express');
const postsRoutes = require('./src/routes/posts.routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/api', postsRoutes);
// 404 JSON Handler para sa mga hindi umiiral na ruta
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use(errorHandler);

// Listen on BLOG_PORT (5000)
const PORT = process.env.BLOG_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Blog API running on port 5000`);
});