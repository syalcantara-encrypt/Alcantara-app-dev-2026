const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const authRoutes = require('./src/routes/auth.routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(express.json());

app.use('/', authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.AUTH_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Auth Server running on port ${PORT}`);
});