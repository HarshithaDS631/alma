let app;
let initError = null;

try {
  app = require('../backend/index.js');
} catch (err) {
  initError = err;
  console.error('[CRITICAL SERVERLESS INIT ERROR]:', err);
}

module.exports = (req, res) => {
  if (initError) {
    console.error('[SERVERLESS INVOCATION ERROR - INIT FAILURE]:', initError);
    return res.status(500).json({
      error: 'Backend Initialization Failure',
      message: initError.message
    });
  }

  // Ensure request socket/connection objects are safely initialized for reverse proxies
  if (!req.socket) req.socket = { remoteAddress: '127.0.0.1' };
  if (!req.connection) req.connection = req.socket;

  try {
    return app(req, res);
  } catch (err) {
    console.error('[SERVERLESS UNHANDLED ERROR]:', err);
    return res.status(500).json({
      error: 'Serverless Execution Error',
      message: err.message
    });
  }
};
