import jwt from 'jsonwebtoken';

const generateToken = (id, email, role) => {
  const payload = { id, role, email };
  console.log("✅ Token Payload:", payload);

  return jwt.sign(payload, process.env.DOCTOR_LOGIN_TOKEN, {
    expiresIn: '1d'
  });
};

export default generateToken;