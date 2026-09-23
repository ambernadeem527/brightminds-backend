const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Security wristband pass missing from authorization headers."
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Malformed token frame configuration detected. Use Bearer format."
    });
  }

  try {
    // FIX: This safely grabs the exact token out of the header
    const rawTokenString = authHeader.split(" ")[1];

    const decryptedPayload = jwt.verify(rawTokenString, process.env.JWT_SECRET);
    req.user = decryptedPayload;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Invalid or expired security token badge recorded.",
      error: error.message
    });
  }
};
