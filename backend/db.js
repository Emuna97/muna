const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // 환경변수 주소, 없으면 기본 주소 사용
    const connURI = process.env.MONGODB_URI || 'mongodb+srv://muna:내비밀번호@cluster0.2tdmm7c.mongodb.net/?appName=Cluster0';
    
    // ❌ 뒤에 { useNewUrlParser: true ... } 같은 찌꺼기 옵션들을 절대 넣지 말고 딱 주소만 넘겨야 합니다!
    await mongoose.connect(connURI);
    
    console.log('🎯 MongoDB Connected Successfully!');
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
