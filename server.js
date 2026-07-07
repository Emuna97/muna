require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize JSON file-based database
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
  console.log('DB directory created');
}

console.log('JSON-based database ready');

// Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/payment', require('./backend/routes/payment'));
app.use('/api/booking', require('./backend/routes/booking'));
app.use('/api/room', require('./backend/routes/room'));
app.use('/api/members', require('./backend/routes/members'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running normally' });
});

// Frontend route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access: http://localhost:${PORT}`);
});
