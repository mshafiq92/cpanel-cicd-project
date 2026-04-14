const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Update this version before every push — lets us verify deploys worked
const APP_VERSION = "1.0.0";
const DEPLOY_TIME = new Date().toISOString();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Root — serve homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Health check — used to verify the app is running after deploy
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Info endpoint — shows version (we change this to verify each deploy)
app.get("/api/info", (req, res) => {
  res.json({
    name: "cpanel-cicd-demo",
    version: APP_VERSION,
    deployedAt: DEPLOY_TIME,
    node: process.version,
    environment: process.env.NODE_ENV || "development",
  });
});

// Hello endpoint
app.get("/api/hello", (req, res) => {
  const name = req.query.name || "World";
  res.json({ message: `Hello, ${name}! Deployed via GitHub Actions CI/CD.` });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
  console.log(`Version: ${APP_VERSION}`);
});

module.exports = app;
