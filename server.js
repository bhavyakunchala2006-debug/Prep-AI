const path = require('path');
const fs = require('fs');

// Load environment variables from .env in root or current directory
const rootEnvPath = fs.existsSync(path.join(__dirname, '.env')) 
  ? path.join(__dirname, '.env') 
  : path.join(__dirname, '../.env');
require('dotenv').config({ path: rootEnvPath });

const express = require('express');
const cors = require('cors');

// Determine frontend directory reliably using absolute paths
const frontendDir = fs.existsSync(path.join(__dirname, 'frontend'))
  ? path.join(__dirname, 'frontend')
  : __dirname;

// Determine backend directory reliably
const backendDir = fs.existsSync(path.join(__dirname, 'backend'))
  ? path.join(__dirname, 'backend')
  : path.join(__dirname, '../backend');

const interviewRoutes = require(path.join(backendDir, 'routes/interviewRoutes'));
const { db } = require(path.join(backendDir, 'db/database'));

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files (index.html, dashboard.html, CSS, JS, JSON assets)
app.use(express.static(frontendDir));

// Attach API Routes
app.use('/api/interviews', interviewRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PrepAI Server Running',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')
  });
});

// Fallback to index.html for unspecified client routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Route Not Found' });
  }
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 PrepAI Server is running at http://localhost:${PORT}`);
  console.log(`🤖 AI Features: ${process.env.GEMINI_API_KEY ? 'Gemini Enabled' : 'Fallback Engine (Set GEMINI_API_KEY in .env)'}`);
  console.log(`📁 Static Frontend Dir: ${frontendDir}`);
  console.log(`==================================================`);
});
