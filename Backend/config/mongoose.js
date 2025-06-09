import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Get the default connection
const db = mongoose.connection;

// Handle connection errors
db.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Connection successful
db.once('open', () => {
  console.log('✅ MongoDB connected (event-based)');
});

export default db;