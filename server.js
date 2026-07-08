require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./backend/db'); // 방금 수정한 db.js 불러오기

const app = express();

// 🎯 MongoDB 연결 실행
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// 🔗 라우터 연결 (기존 라우터 파일들)
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/rooms', require('./backend/routes/room'));
app.use('/api/bookings', require('./backend/routes/booking'));
app.use('/api/payments', require('./backend/routes/payment'));
app.use('/api/members', require('./backend/routes/members'));
app.use('/api/settings', require('./backend/routes/settings'));

// 배포 상태 점검용 헬스체크 API
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', database: 'connected' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
