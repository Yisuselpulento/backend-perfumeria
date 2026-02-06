import jwt from "jsonwebtoken";

export const optionalAuth = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    req.userId = null;
    req.isAdmin = false;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId || null;
    req.isAdmin = decoded.isAdmin || false;

    next();
  } catch (error) {
    // Token inválido o expirado → se trata como invitado
    req.userId = null;
    req.isAdmin = false;
    next();
  }
};