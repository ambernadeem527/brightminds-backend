// middleware/errorHandler.js
// ---------------------------------------------------------------------------
// DAY 14 - Centralized Error Control & Global Diagnostics
// JOB: Catch any application-wide runtime crash, clean up the response shape,
// and keep the server online when an exception hits.
// ---------------------------------------------------------------------------
 
// Express recognises an error-handling middleware ONLY when the function is
// declared with exactly FOUR parameters: (err, req, res, next).
module.exports = (err, req, res, next) => {
 
  // Log the full technical details (including the stack trace) in the private
  // terminal window so the developer can investigate. Clients never see this.
  console.error("[BrightMinds Global Error Handler]", err.stack || err.message);
 
  // If a response has already started streaming, we cannot send a second one.
  // Hand the error to Express's built-in handler so it closes the connection.
  if (res.headersSent) {
    return next(err);
  }
 
  // Default to HTTP 500 (Internal Server Error) unless the error carries its own
  // status. Example: Express's JSON parser sets 400 on malformed request bodies.
  const failureStatusCode = err.statusCode || err.status || 500;
 
  // Which environment is running? Falls back to "production" when NODE_ENV is unset.
  const runtimeEnvironment = process.env.NODE_ENV || "production";
 
  // SECURITY RULE: for server-side faults (500 and above) never reveal the raw
  // message outside development, because messages such as
  // 'column "x" does not exist' expose our database structure to attackers.
  // Client mistakes (4xx) are safe to explain, so their message is shown.
  const exposeRealMessage = failureStatusCode < 500 || runtimeEnvironment === "development";
 
  // Construct a uniform, clean JSON response structure for every failure.
  // The stack trace is deliberately NOT included.
  return res.status(failureStatusCode).json({
    success: false,
    status: failureStatusCode,
    message: exposeRealMessage
      ? (err.message || "Request could not be processed.")
      : "An unexpected system anomaly was encountered inside the BrightMinds engine.",
    environment: runtimeEnvironment
  });
};
