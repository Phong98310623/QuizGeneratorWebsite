const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use(cors({ origin: corsOrigin, credentials: true }));

app.use((req, res, next) => {
  const baseUrl = process.env.BASE_URL || "http://localhost";
  const origins = process.env.FRAME_ANCESTORS || `'self' ${baseUrl}:3000 ${baseUrl}:3000`;
  res.setHeader("Content-Security-Policy", `frame-ancestors ${origins}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


/**
 * API routes
 */
app.use("/api/users", require("./routes/user.route"));
app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/notifications', require('./routes/notification.route'));
app.use('/api/reports', require('./routes/report.route'));
app.use('/api/content', require('./routes/content.route'));
app.use('/api/public', require('./routes/public.route'));
app.use('/api/sets', require('./routes/sets.route'));
app.use('/api/ai', require('./routes/ai.route'));

/**
 * Serve React build
 */
const clientPath = path.join(__dirname, "..", "..", "frontend", "dist");
app.use(express.static(clientPath));

/**
 * React Router fallback (Express 5 FIX)
 */
app.use((req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

module.exports = app;