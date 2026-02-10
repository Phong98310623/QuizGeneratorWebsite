const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/**
 * API routes
 */
app.use("/api/users", require("./routes/user.route"));
app.use('/api/auth', require('./routes/auth.route'));

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