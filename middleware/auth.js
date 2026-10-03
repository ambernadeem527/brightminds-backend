// middleware/auth.js
// ---------------------------------------------------------------------------
// DAY 9/15 - Comprehensive Refreshed Integration Authentication Matrix Guard
// ---------------------------------------------------------------------------
 
const jwt = require('jsonwebtoken');
 
// Primary Authentication Bouncer Interceptor
const auth = function(req, res, next) {
  const authHeader = req.header('Authorization');
 
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Invalid Header Token Setup."
    });
  }
 
  try {
    // Take the part after "Bearer "
    const tokenString = authHeader.split(' ')[1];
    
    // Hardcoded fallback safety system to bypass environment loading anomalies
    const secretKey = process.env.JWT_SECRET || 'BrightMindsSuperSecretTokenKey2026';
    
    // Verify it cleanly
    const verifiedData = jwt.verify(tokenString, secretKey);
 
    req.user = verifiedData; // Contains id, email, role
    next();                  // Let the request continue down the pipeline
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Token verification anomaly encountered."
    });
  }
};
 
// Secondary Layered Role Checker Matrix Guard
const authorizeRoles = (...permittedRoles) => {
  return (req, res, next) => {
 
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: "Internal configuration failure: Role checker invoked without authentication guard."
      });
    }
 
    if (!permittedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Your assigned role profile (${req.user.role}) is unauthorized to access this channel.`
      });
    }
 
    next();
  };
};
 
module.exports = { auth, authorizeRoles };


