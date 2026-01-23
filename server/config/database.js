import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillexchange';
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB Connected Successfully');
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
