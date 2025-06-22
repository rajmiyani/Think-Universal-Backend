import jwt from 'jsonwebtoken';

export const verifyTokenAvailability = (req, res, next) => {
  const authHeader = req.headers['authorization'];
//   console.log("AuthHeader", authHeader);
  
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
//   console.log("Token", token);
  
  try {
    const decoded = jwt.verify(token, process.env.DOCTOR_LOGIN_TOKEN);
    // console.log("Decoded", decoded);
    
    req.user = decoded;    
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};