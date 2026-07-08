const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // 환경변수에서 주소를 가져오거나, 없을 경우 방금 만든 주소를 기본값으로 사용합니다.
    const connURI = process.env.MONGODB_URI || 'mongodb+srv://muna:Slawhawkd56!@cluster0.2tdmm7c.mongodb.net/muna_db?retryWrites=true&w=majority';
    
    await mongoose.connect(connURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🎯 MongoDB Connected Successfully!');
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
