const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const postsRoutes = require("./src/routes/posts.routes");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:5173", "http://127.0.0.1:5173"],
  })
);
app.use(express.json());
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later" },
});

app.use("/api", apiLimiter, postsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.BLOG_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Blog API running on port ${PORT}`);
});