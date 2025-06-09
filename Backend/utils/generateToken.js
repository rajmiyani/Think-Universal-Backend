import jwt from 'jsonwebtoken';

const generateToken = (id, role = "admin") => {
  const payload = { id, role };
  console.log("✅ Token Payload:", payload);

  return jwt.sign(payload, process.env.DOCTOR_LOGIN_TOKEN, {
    expiresIn: '1d'
  });
};

export default generateToken;