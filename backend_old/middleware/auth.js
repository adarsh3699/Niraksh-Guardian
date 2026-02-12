const { verifyAccessToken } = require("../utils");

/**
 * Authentication middleware that verifies JWT tokens
 * and attaches the user information to the request object
 */
const authenticateUser = (req, res, next) => {
    try {
        const tokenResult = verifyAccessToken(req);

        if (!tokenResult.authorization) {
            return res.status(401).json({
                statusCode: 401,
                msg: tokenResult.message || "Authentication failed"
            });
        }

        // Attach user info to the request object
        req.user = tokenResult.payload;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            statusCode: 500,
            msg: "Internal server error"
        });
    }
};

/**
 * Optional authentication middleware that doesn't reject requests
 * without tokens, but still attaches user info if available
 */
const optionalAuth = (req, res, next) => {
    try {
        if (req.headers.authorization) {
            const tokenResult = verifyAccessToken(req);
            if (tokenResult.authorization) {
                req.user = tokenResult.payload;
            }
        }
        next();
    } catch (error) {
        // Continue even if auth fails
        next();
    }
};

module.exports = { authenticateUser, optionalAuth }; 