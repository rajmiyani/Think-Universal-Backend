import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Connect to Admin Panel DB (ThinkUniversalWeb)
export const adminDB = mongoose.createConnection(process.env.MONGO_URI, {
  dbName: 'ThinkUniversalWeb',
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

adminDB.on('connected', () => {
  console.log('✅ Connected to Admin DB (ThinkUniversalWeb)');
});

adminDB.on('error', (err) => {
  console.error('❌ Admin DB connection error:', err.message);
  process.exit(1);
});

// ✅ Connect to Mobile App DB (newthinkuniversal)
export const mobileDB = mongoose.createConnection(process.env.MONGO_URIS, {
  dbName: 'newthinkuniversal',
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mobileDB.on('connected', () => {
  console.log('✅ Connected to Mobile DB (newthinkuniversal)');
});

mobileDB.on('error', (err) => {
  console.error('❌ Mobile DB connection error:', err.message);
  process.exit(1);
});
