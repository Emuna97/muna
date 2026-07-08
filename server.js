require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Payload too large' });
  }
  next(err);
});

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
app.use('/api/settings', require('./backend/routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running normally' });
});

// Frontend route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const port = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
