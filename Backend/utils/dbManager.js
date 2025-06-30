import mongoose from "mongoose";

const connections = {};

export const getDoctorDB = (doctorId) => {
  const dbName = `doctor_${doctorId}`;
  
  if (connections[dbName]) {
    return connections[dbName];
  }

  const conn = mongoose.createConnection(
    process.env.MONGO_URI,
    { useNewUrlParser: true, useUnifiedTopology: true }
  );

  // Define schema locally in this connection
  conn.model("Patient", new mongoose.Schema({
    firstName: String,
    lastName: String,
    age: Number,
    gender: String,
    phone: String,
  }));

  connections[dbName] = conn;
  return conn;
};
