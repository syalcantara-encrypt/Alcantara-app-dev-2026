const path = require("path");
// Load the shared .env from the project root (one folder up)
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./src/routes/auth.routes");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

app.use(helmet());                                   // safer HTTP headers
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:5173", "http://127.0.0.1:5173"],
  })
);                                                   // lets the React app call this server
app.use(express.json());
app.use(cookieParser());

// Slows down brute-force attempts on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later" },
});

app.use("/", authLimiter, authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.AUTH_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Auth Server running on port ${PORT}`);
});