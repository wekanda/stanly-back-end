const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('⚠️  Using in-memory mock database for testing');
    console.log('💡 To enable full functionality, please set up MongoDB Atlas or local MongoDB');

    // For testing purposes, we'll continue without database
    // The app will work but data won't persist
  }
};

module.exports = connectDB;