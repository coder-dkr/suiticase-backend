import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';


const protect = async (req, res, next) => {
  try {
    let token;

    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found'
        });
      }

      if (!user.isVerified) {
        return res.status(401).json({
          success: false,
          message: 'Account not verified. Please verify your email first'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};


const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized to access this resource`
      });
    }

    next();
  };
};


const checkVerified = async (req, res, next) => {
  try {
    if (!req.user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Account not verified. Please verify your email first'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error checking verification status'
    });
  }
};

export {
  protect,
  authorize,
  checkVerified
};