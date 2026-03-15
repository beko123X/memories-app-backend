import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: "unauthenticated" });
    }
    
    const token = authHeader.split(" ")[1];
    let decodedData;

    const isCustomAuth = token.length < 500;
    
    if (isCustomAuth) {
      decodedData = jwt.verify(token, 'test');
      req.userId = decodedData?.id;  // ✅ التعديل هنا
    } else {
      decodedData = jwt.decode(token);
      req.userId = decodedData?.sub;
    }
    
    next();

  } catch (error) {
    console.log(`Auth Middleware error ${error}`);
    res.status(401).json({ message: "Unauthenticated" });
  }
}

export default auth;