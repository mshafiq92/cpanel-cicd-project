const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const APP_VERSION = "1.2.0";
const DEPLOY_TIME = new Date().toISOString();
const DEPLOYMENTS_FILE = path.join(__dirname, "../data/deployments.json");

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// ─── Helper: read deployments file ───────────────────────────────────────────
function readDeployments() {
  try {
    const raw = fs.readFileSync(DEPLOYMENTS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ─── Helper: write deployments file ──────────────────────────────────────────
function writeDeployments(data) {
  fs.writeFileSync(DEPLOYMENTS_FILE, JSON.stringify(data, null, 2));
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Root — serve landing page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Health check — used by CI/CD to verify deploy succeeded
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// App info — version and deploy metadata
app.get("/api/info", (req, res) => {
  res.json({
    name: "cpanel-cicd-demo",
    version: APP_VERSION,
    deployedAt: DEPLOY_TIME,
    node: process.version,
    environment: process.env.NODE_ENV || "development",
  });
});

// Live server stats — used by dashboard
app.get("/api/stats", (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: "OK",
    version: APP_VERSION,
    deployedAt: DEPLOY_TIME,
    uptime: process.uptime(),
    node: process.version,
    environment: process.env.NODE_ENV || "development",
    memory: {
      used: Math.round(mem.heapUsed / 1024 / 1024) + " MB",
      total: Math.round(mem.heapTotal / 1024 / 1024) + " MB",
      rss: Math.round(mem.rss / 1024 / 1024) + " MB",
    },
    platform: process.platform,
    pid: process.pid,
  });
});

// Deployment history — returns all past deploys
app.get("/api/deployments", (req, res) => {
  const deployments = readDeployments();
  res.json(deployments.slice().reverse()); // newest first
});

// Record a new deployment — called by GitHub Actions after each deploy
app.post("/api/deployments", (req, res) => {
  const { version, message, status } = req.body;
  if (!version) {
    return res.status(400).json({ error: "version is required" });
  }
  const deployments = readDeployments();
  const newEntry = {
    version: version || APP_VERSION,
    deployedAt: new Date().toISOString(),
    message: message || "Automated deployment via GitHub Actions",
    status: status || "success",
  };
  deployments.push(newEntry);
  writeDeployments(deployments);
  res.status(201).json(newEntry);
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
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
