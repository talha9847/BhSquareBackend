const jwt = require("jsonwebtoken");

function authMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "my-app",
      });
      req.user = decoded;

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: "Token is invalid or expired" });
    }
  };
}

module.exports = { authMiddleware };
