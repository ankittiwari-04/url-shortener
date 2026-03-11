require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const urlRoutes = require('./routes/url.routes');
const { startCleanupJob } = require('./utils/cleanup');

connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check FIRST before any other routes
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', urlRoutes);
app.use('/', urlRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCleanupJob();
});