require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const urlRoutes = require('./routes/url.routes');

connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', urlRoutes);
app.use('/', urlRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});