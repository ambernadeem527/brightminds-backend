// middleware/auth.js
// ---------------------------------------------------------------------------
// DAY 9 - Authentication Guard + Role Authorization Guard
// This file now exports TWO middleware tools: auth and authorizeRoles.
// ---------------------------------------------------------------------------
 
const jwt = require('jsonwebtoken');
 
// Primary Authentication Bouncer Interceptor (Existing Core Block)
// JOB: prove WHO the caller is by verifying their token.
const auth = function(req, res, next) {
  // Read the Authorization header, e.g. "Bearer eyJhbGciOi..."
  const authHeader = req.header('Authorization');
 
  // Combined check: header missing OR not in 'Bearer <token>' format.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Invalid Header Token Setup."
    });
  }
 
  try {
    // Take the part after "Bearer " and verify it against our secret key.
    const tokenString = authHeader.split(' ')[1];
    const verifiedData = jwt.verify(tokenString, process.env.JWT_SECRET);
 
    req.user = verifiedData; // Contains id, email, role
    next();                  // Let the request continue down the pipeline
  } catch (err) {
    // Forged, tampered, or expired token.
    return res.status(401).json({
      success: false,
      message: "Token verification anomaly encountered."
    });
  }
};
 
// Secondary Layered Role Checker Matrix Guard
// JOB: decide whether the (already identified) user is ALLOWED into this route.
const authorizeRoles = (...permittedRoles) => {
  return (req, res, next) => {
 
    // Step 1: Ensure user context exists (auth middleware must execute first)
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: "Internal configuration failure: Role checker invoked " +
                 "without authentication guard."
      });
    }
 
    // Step 2: Evaluate if the user's role matches the allowed permissions
    if (!permittedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Your assigned role profile (${req.user.role}) ` +
                 `is unauthorized to access this channel.`
      });
    }
 
    // Step 3: Match confirmed! Continue forward safely down the pipe
    next();
  };
};
 
// Export BOTH tools inside one object
module.exports = { auth, authorizeRoles };

