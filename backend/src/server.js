const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});