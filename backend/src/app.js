const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// Cho phép frontend (Vite dev server) gọi API từ origin khác (CORS)
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/**
 * API routes
 */
app.use("/api/users", require("./routes/user.route"));
app.use('/api/auth', require('./routes/auth.route'));
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